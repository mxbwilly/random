"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/auth/guards";
import { findOrCreateCourse, findOrCreateTeacher } from "@/lib/catalog/search";
import { storage, type UploadTarget } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import { ALLOWED_TYPES, CURRENT_YEAR, MAX_EXAM_FILES, MAX_SOLUTION_FILES, MIN_YEAR, extensionFor } from "./files";

const fileMeta = z.object({
  name: z.string().min(1).max(200),
  type: z.string(),
  size: z.number().int().positive(),
  kind: z.enum(["EXAM", "SOLUTIONS"]),
});

const draftSchema = z.object({
  course: z.union([
    z.object({ id: z.string().min(1) }),
    z.object({ code: z.string().trim().min(2).max(20), title: z.string().trim().min(2).max(120) }),
  ]),
  teacher: z.union([z.object({ id: z.string().min(1) }), z.object({ name: z.string().trim().min(2).max(80) })]),
  year: z.number().int().min(MIN_YEAR).max(CURRENT_YEAR),
  term: z.enum(["FALL", "SPRING", "SUMMER", "WINTER"]),
  kind: z.enum(["MIDTERM", "FINAL", "QUIZ", "PRACTICE", "OTHER"]),
  title: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(2000).optional(),
  anonymous: z.boolean(),
  attested: z.literal(true),
  files: z.array(fileMeta).min(1).max(MAX_EXAM_FILES + MAX_SOLUTION_FILES),
});

export type DraftInput = z.input<typeof draftSchema>;
export type DraftResult =
  | { ok: true; examId: string; uploads: { fileId: string; target: UploadTarget }[] }
  | { ok: false; error: string };

/**
 * Step 1 of an upload: validate metadata, create the Exam (HIDDEN) and its
 * ExamFile rows, and hand back one upload target per file.
 */
export async function createExamDraft(input: DraftInput): Promise<DraftResult> {
  const user = await requireUser();
  if (!rateLimit(`upload:${user.id}`, 20, 60 * 60 * 1000).ok) return { ok: false, error: "Upload limit reached. Try again later." };

  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const examFiles = data.files.filter((f) => f.kind === "EXAM");
  const solutionFiles = data.files.filter((f) => f.kind === "SOLUTIONS");
  if (examFiles.length === 0) return { ok: false, error: "Attach at least one exam file." };
  if (examFiles.length > MAX_EXAM_FILES) return { ok: false, error: `At most ${MAX_EXAM_FILES} exam files.` };
  if (solutionFiles.length > MAX_SOLUTION_FILES) return { ok: false, error: `At most ${MAX_SOLUTION_FILES} solution files.` };
  for (const f of data.files) {
    if (!extensionFor(f.type, f.name)) return { ok: false, error: `"${f.name}" isn't a PDF or image.` };
    if (f.size > env.maxUploadBytes) return { ok: false, error: `"${f.name}" is larger than ${env.maxUploadBytes / 1024 / 1024} MB.` };
  }

  // Resolve course and teacher, both scoped to the caller's school.
  let courseId: string;
  if ("id" in data.course) {
    const c = await db.course.findFirst({ where: { id: data.course.id, schoolId: user.schoolId } });
    if (!c) return { ok: false, error: "Course not found." };
    courseId = c.id;
  } else {
    courseId = (await findOrCreateCourse(user.schoolId, user.id, data.course.code, data.course.title)).course.id;
  }
  let teacherId: string;
  if ("id" in data.teacher) {
    const t = await db.teacher.findFirst({ where: { id: data.teacher.id, schoolId: user.schoolId } });
    if (!t) return { ok: false, error: "Teacher not found." };
    teacherId = t.id;
  } else {
    teacherId = (await findOrCreateTeacher(user.schoolId, user.id, data.teacher.name)).teacher.id;
  }

  const examId = randomUUID();
  const fileRows = data.files.map((f) => {
    const id = randomUUID();
    const ext = extensionFor(f.type, f.name)!;
    return {
      id,
      kind: f.kind,
      storagePath: `schools/${user.schoolId}/exams/${examId}/${id}.${ext}`,
      originalName: f.name,
      mimeType: ALLOWED_TYPES[f.type] ? f.type : `application/${ext}`,
      sizeBytes: f.size,
    };
  });

  await db.exam.create({
    data: {
      id: examId,
      schoolId: user.schoolId,
      courseId,
      teacherId,
      uploaderId: user.id,
      anonymous: data.anonymous,
      year: data.year,
      term: data.term,
      kind: data.kind,
      title: data.title || null,
      notes: data.notes || null,
      hasSolutions: solutionFiles.length > 0,
      status: "HIDDEN",
      attestedAt: new Date(),
      files: { create: fileRows },
    },
  });

  const uploads = await Promise.all(
    fileRows.map(async (f) => ({ fileId: f.id, target: await storage.createUploadTarget(f.storagePath, f.mimeType) })),
  );
  return { ok: true, examId, uploads };
}

/**
 * Step 2: after the browser finished uploading, confirm every file exists in
 * storage and publish the exam. Missing files are dropped; an exam with no
 * exam file left is deleted.
 */
export async function finalizeExam(examId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  const exam = await db.exam.findFirst({ where: { id: examId, uploaderId: user.id, status: "HIDDEN" }, include: { files: true } });
  if (!exam) return { ok: false, error: "Upload not found." };

  const missing: string[] = [];
  for (const f of exam.files) {
    const s = await storage.stat(f.storagePath);
    if (!s || (s.size > 0 && s.size > env.maxUploadBytes)) missing.push(f.id);
    else if (s.size > 0 && s.size !== f.sizeBytes) await db.examFile.update({ where: { id: f.id }, data: { sizeBytes: s.size } });
  }
  if (missing.length) await db.examFile.deleteMany({ where: { id: { in: missing } } });

  const remaining = exam.files.filter((f) => !missing.includes(f.id));
  if (!remaining.some((f) => f.kind === "EXAM")) {
    await db.exam.delete({ where: { id: examId } });
    return { ok: false, error: "The exam file didn't upload. Please try again." };
  }
  await db.exam.update({
    where: { id: examId },
    data: { status: "LIVE", hasSolutions: remaining.some((f) => f.kind === "SOLUTIONS") },
  });
  revalidatePath(`/teachers/${exam.teacherId}`);
  revalidatePath(`/courses/${exam.courseId}`);
  return { ok: true };
}

export async function voteExam(examId: string, value: 1 | -1 | 0) {
  const user = await requireUser();
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId: user.schoolId, status: "LIVE" } });
  if (!exam) return;
  if (value === 0) {
    await db.vote.deleteMany({ where: { userId: user.id, examId } });
  } else {
    await db.vote.upsert({
      where: { userId_examId: { userId: user.id, examId } },
      update: { value },
      create: { userId: user.id, examId, value },
    });
  }
  revalidatePath(`/exams/${examId}`);
}

/** Uploader or admin removes an exam. Files are deleted from storage. */
export async function deleteExam(examId: string) {
  const user = await requireUser();
  const exam = await db.exam.findFirst({ where: { id: examId, schoolId: user.schoolId }, include: { files: true } });
  if (!exam) return;
  if (exam.uploaderId !== user.id && user.role !== "ADMIN") return;
  await Promise.all(exam.files.map((f) => storage.deleteObject(f.storagePath)));
  await db.exam.delete({ where: { id: examId } });
  if (user.role === "ADMIN" && exam.uploaderId !== user.id) {
    await db.auditLog.create({ data: { actorId: user.id, action: "exam.delete", targetType: "Exam", targetId: examId } });
  }
  redirect(`/teachers/${exam.teacherId}`);
}
