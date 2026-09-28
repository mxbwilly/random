"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications/notify";
import { kindLabel, termLabel } from "@/lib/normalize";
import { CURRENT_YEAR, MIN_YEAR } from "@/lib/exams/files";
import type { ActionState } from "@/app/(auth)/actions";

// Selects submit "any" for the placeholder option; treat it like empty.
const blank = (v: string | undefined) => (v && v !== "any" ? v : undefined);
const optionalId = z.string().trim().optional().transform(blank);
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.string().trim().optional().transform(blank).pipe(z.enum(values).optional());

const createSchema = z.object({
  courseId: optionalId,
  teacherId: optionalId,
  year: z.string().trim().optional().transform(blank).transform((v) => (v ? Number(v) : undefined)).pipe(z.number().int().min(MIN_YEAR).max(CURRENT_YEAR).optional()),
  term: optionalEnum(["FALL", "SPRING", "SUMMER", "WINTER"] as const),
  kind: optionalEnum(["MIDTERM", "FINAL", "QUIZ", "PRACTICE", "OTHER"] as const),
  message: z.string().trim().min(10, "Say a little more (at least 10 characters).").max(2000),
});

export async function createRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!rateLimit(`request:${user.id}`, 10, 60 * 60 * 1000).ok) return { error: "You've posted a lot of requests recently. Try again later." };
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, values: { message: String(formData.get("message") ?? "") } };
  const d = parsed.data;
  if (!d.courseId && !d.teacherId) return { error: "Pick a course or a teacher so people know what you're looking for.", values: { message: d.message } };

  // Make sure referenced catalog rows belong to the same school.
  if (d.courseId && !(await db.course.findFirst({ where: { id: d.courseId, schoolId: user.schoolId } }))) return { error: "Course not found." };
  if (d.teacherId && !(await db.teacher.findFirst({ where: { id: d.teacherId, schoolId: user.schoolId } }))) return { error: "Teacher not found." };

  const request = await db.examRequest.create({
    data: { schoolId: user.schoolId, requesterId: user.id, courseId: d.courseId, teacherId: d.teacherId, year: d.year, term: d.term, kind: d.kind, message: d.message },
  });
  revalidatePath("/requests");
  redirect(`/requests/${request.id}`);
}

const replySchema = z.object({ requestId: z.string().min(1), body: z.string().trim().min(1, "Write a reply.").max(2000) });

export async function replyToRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!rateLimit(`reply:${user.id}`, 60, 60 * 60 * 1000).ok) return { error: "Slow down a little." };
  const parsed = replySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const request = await db.examRequest.findFirst({ where: { id: parsed.data.requestId, schoolId: user.schoolId } });
  if (!request) return { error: "Request not found." };

  await db.requestReply.create({ data: { requestId: request.id, authorId: user.id, body: parsed.data.body } });
  await notify(request.requesterId, user.id, "request.reply", {
    title: `${user.displayName} replied to your exam request`,
    body: parsed.data.body.slice(0, 200),
    href: `/requests/${request.id}`,
  });
  revalidatePath(`/requests/${request.id}`);
  return { success: "Reply posted." };
}

export async function setRequestStatus(requestId: string, status: "OPEN" | "CLOSED") {
  const user = await requireUser();
  const request = await db.examRequest.findFirst({ where: { id: requestId, schoolId: user.schoolId } });
  if (!request || (request.requesterId !== user.id && user.role !== "ADMIN")) return;
  await db.examRequest.update({ where: { id: requestId }, data: { status } });
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/requests");
}

/** Called after an upload made in response to a request. */
export async function fulfillRequest(requestId: string, examId: string, actorId: string) {
  const [request, exam] = await Promise.all([
    db.examRequest.findUnique({ where: { id: requestId }, include: { course: true, teacher: true } }),
    db.exam.findUnique({ where: { id: examId } }),
  ]);
  if (!request || !exam || request.schoolId !== exam.schoolId || request.status !== "OPEN") return;
  await db.examRequest.update({ where: { id: requestId }, data: { status: "FULFILLED", fulfilledByExamId: examId } });
  await notify(request.requesterId, actorId, "request.fulfilled", {
    title: `Someone uploaded an exam for your request`,
    body: `${termLabel(exam.term)} ${exam.year} ${kindLabel(exam.kind)}${request.course ? ` · ${request.course.code}` : ""}${request.teacher ? ` · ${request.teacher.displayName}` : ""}`,
    href: `/exams/${examId}`,
  });
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/requests");
}
