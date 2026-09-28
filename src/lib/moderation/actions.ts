"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/rate-limit";
import { storage } from "@/lib/storage";
import { normalizeCourseCode, normalizeName } from "@/lib/normalize";
import type { ActionState } from "@/app/(auth)/actions";

// ---------- Reporting (any student) ----------

const reportSchema = z.object({
  examId: z.string().optional().transform((v) => v || undefined),
  commentId: z.string().optional().transform((v) => v || undefined),
  reason: z.enum(["COPYRIGHT", "WRONG_INFO", "INAPPROPRIATE", "OTHER"], { message: "Pick a reason." }),
  details: z.string().trim().max(2000),
});

export async function submitReport(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!rateLimit(`report:${user.id}`, 20, 24 * 60 * 60 * 1000).ok) return { error: "You've filed a lot of reports today." };
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { examId, commentId, reason, details } = parsed.data;
  if (!examId && !commentId) return { error: "Nothing to report." };
  if (examId && !(await db.exam.findFirst({ where: { id: examId, schoolId: user.schoolId } }))) return { error: "Exam not found." };
  if (commentId && !(await db.comment.findFirst({ where: { id: commentId, schoolId: user.schoolId } }))) return { error: "Comment not found." };
  if (reason === "OTHER" && details.length < 10) return { error: "Tell us a bit more." };

  const open = await db.report.findFirst({ where: { examId, commentId, reporterId: user.id, status: "OPEN" } });
  if (open) return { error: "You already reported this. An admin will review it." };
  await db.report.create({ data: { examId, commentId, reporterId: user.id, reason, details: details || null } });
  return { success: "Thanks. An admin will review this shortly." };
}

// ---------- Admin: report queue ----------

async function audit(actorId: string, action: string, targetType: string, targetId: string, metadata?: Record<string, string | number | boolean | null | string[]>) {
  await db.auditLog.create({ data: { actorId, action, targetType, targetId, metadata } });
}

export async function resolveReport(reportId: string, outcome: "HIDE" | "REMOVE" | "DISMISS" | "DELETE_COMMENT") {
  const admin = await requireAdmin();
  const report = await db.report.findUnique({ where: { id: reportId }, include: { exam: { include: { files: true } }, comment: true } });
  if (!report) return;

  if (report.exam) {
    if (outcome === "HIDE") {
      await db.exam.update({ where: { id: report.exam.id }, data: { status: "HIDDEN" } });
      await audit(admin.id, "exam.hide", "Exam", report.exam.id, { reportId });
    } else if (outcome === "REMOVE") {
      await Promise.all(report.exam.files.map((f) => storage.deleteObject(f.storagePath)));
      await db.examFile.deleteMany({ where: { examId: report.exam.id } });
      await db.exam.update({ where: { id: report.exam.id }, data: { status: "REMOVED" } });
      await audit(admin.id, "exam.remove", "Exam", report.exam.id, { reportId, reason: report.reason });
    }
  }
  if (report.comment && outcome === "DELETE_COMMENT") {
    await db.comment.update({ where: { id: report.comment.id }, data: { deletedAt: new Date(), body: "" } });
    await audit(admin.id, "comment.delete", "Comment", report.comment.id, { reportId });
  }
  // Resolve every open report about the same target in one go.
  await db.report.updateMany({
    where: { status: "OPEN", ...(report.examId ? { examId: report.examId } : { commentId: report.commentId }) },
    data: { status: outcome === "DISMISS" ? "DISMISSED" : "RESOLVED", resolvedById: admin.id, resolvedAt: new Date() },
  });
  revalidatePath("/admin/reports");
}

export async function restoreExam(examId: string) {
  const admin = await requireAdmin();
  const exam = await db.exam.findUnique({ where: { id: examId } });
  if (!exam || exam.status !== "HIDDEN") return;
  await db.exam.update({ where: { id: examId }, data: { status: "LIVE" } });
  await audit(admin.id, "exam.restore", "Exam", examId);
  revalidatePath("/admin/reports");
  revalidatePath(`/exams/${examId}`);
}

// ---------- Admin: catalog ----------

export async function renameTeacher(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id"));
  const name = String(formData.get("displayName") ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2) return { error: "Enter a name." };
  const t = await db.teacher.findFirst({ where: { id, schoolId: admin.schoolId } });
  if (!t) return { error: "Not found." };
  await db.teacher.update({ where: { id }, data: { displayName: name, normalizedName: normalizeName(name) } });
  await audit(admin.id, "teacher.rename", "Teacher", id, { from: t.displayName, to: name });
  revalidatePath("/admin/catalog");
  return { success: "Renamed." };
}

export async function renameCourse(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id"));
  const code = String(formData.get("code") ?? "").trim().replace(/\s+/g, " ").toUpperCase();
  const title = String(formData.get("title") ?? "").trim();
  if (code.length < 2 || title.length < 2) return { error: "Enter a code and a title." };
  const c = await db.course.findFirst({ where: { id, schoolId: admin.schoolId } });
  if (!c) return { error: "Not found." };
  const clash = await db.course.findFirst({ where: { schoolId: admin.schoolId, normalizedCode: normalizeCourseCode(code), NOT: { id } } });
  if (clash) return { error: `Another course already uses ${clash.code}. Merge instead.` };
  await db.course.update({ where: { id }, data: { code, normalizedCode: normalizeCourseCode(code), title } });
  await audit(admin.id, "course.rename", "Course", id, { from: c.code, to: code });
  revalidatePath("/admin/catalog");
  return { success: "Saved." };
}

/** Moves every exam/request/comment from `fromId` onto `intoId`, then deletes `fromId`. */
export async function mergeTeachers(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const fromId = String(formData.get("fromId"));
  const intoId = String(formData.get("intoId"));
  if (!fromId || !intoId || fromId === intoId) return { error: "Pick two different teachers." };
  const [from, into] = await Promise.all([
    db.teacher.findFirst({ where: { id: fromId, schoolId: admin.schoolId } }),
    db.teacher.findFirst({ where: { id: intoId, schoolId: admin.schoolId } }),
  ]);
  if (!from || !into) return { error: "Teacher not found." };
  await db.$transaction([
    db.exam.updateMany({ where: { teacherId: fromId }, data: { teacherId: intoId } }),
    db.examRequest.updateMany({ where: { teacherId: fromId }, data: { teacherId: intoId } }),
    db.comment.updateMany({ where: { teacherId: fromId }, data: { teacherId: intoId } }),
    db.teacher.delete({ where: { id: fromId } }),
  ]);
  await audit(admin.id, "teacher.merge", "Teacher", intoId, { merged: from.displayName, fromId });
  revalidatePath("/admin/catalog");
  return { success: `Merged "${from.displayName}" into "${into.displayName}".` };
}

export async function mergeCourses(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const fromId = String(formData.get("fromId"));
  const intoId = String(formData.get("intoId"));
  if (!fromId || !intoId || fromId === intoId) return { error: "Pick two different courses." };
  const [from, into] = await Promise.all([
    db.course.findFirst({ where: { id: fromId, schoolId: admin.schoolId } }),
    db.course.findFirst({ where: { id: intoId, schoolId: admin.schoolId } }),
  ]);
  if (!from || !into) return { error: "Course not found." };
  await db.$transaction([
    db.exam.updateMany({ where: { courseId: fromId }, data: { courseId: intoId } }),
    db.examRequest.updateMany({ where: { courseId: fromId }, data: { courseId: intoId } }),
    db.course.delete({ where: { id: fromId } }),
  ]);
  await audit(admin.id, "course.merge", "Course", intoId, { merged: from.code, fromId });
  revalidatePath("/admin/catalog");
  return { success: `Merged ${from.code} into ${into.code}.` };
}

// ---------- Admin: schools ----------

const schoolSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,60}$/, "Slug: lowercase letters, numbers and dashes."),
  emailDomains: z.string().transform((v) => v.split(/[,\s]+/).map((d) => d.trim().toLowerCase()).filter(Boolean)).pipe(z.array(z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, "Enter valid domains like school.edu")).min(1, "Add at least one email domain.")),
});

export async function createSchool(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = schoolSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, slug, emailDomains } = parsed.data;
  const taken = await db.school.findFirst({ where: { OR: [{ slug }, { emailDomains: { hasSome: emailDomains } }] } });
  if (taken) return { error: `${taken.name} already uses that slug or one of those domains.` };
  const school = await db.school.create({ data: { name, slug, emailDomains } });
  await audit(admin.id, "school.create", "School", school.id, { name, emailDomains });
  revalidatePath("/admin/schools");
  return { success: `${name} added. Students with those domains can sign up now.` };
}

export async function updateSchoolDomains(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id"));
  const parsed = schoolSchema.shape.emailDomains.safeParse(String(formData.get("emailDomains") ?? ""));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const clash = await db.school.findFirst({ where: { emailDomains: { hasSome: parsed.data }, NOT: { id } } });
  if (clash) return { error: `${clash.name} already uses one of those domains.` };
  await db.school.update({ where: { id }, data: { emailDomains: parsed.data } });
  await audit(admin.id, "school.domains", "School", id, { emailDomains: parsed.data });
  revalidatePath("/admin/schools");
  return { success: "Domains updated." };
}

export async function adminDeleteExam(examId: string) {
  const admin = await requireAdmin();
  const exam = await db.exam.findUnique({ where: { id: examId }, include: { files: true } });
  if (!exam) return;
  await Promise.all(exam.files.map((f) => storage.deleteObject(f.storagePath)));
  await db.exam.delete({ where: { id: examId } });
  await audit(admin.id, "exam.delete", "Exam", examId);
  redirect("/admin/reports");
}
