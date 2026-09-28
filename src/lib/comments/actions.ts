"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications/notify";
import type { ActionState } from "@/app/(auth)/actions";

const schema = z.object({
  examId: z.string().optional().transform((v) => v || undefined),
  teacherId: z.string().optional().transform((v) => v || undefined),
  parentId: z.string().optional().transform((v) => v || undefined),
  body: z.string().trim().min(1, "Write a comment.").max(2000),
});

export async function addComment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!rateLimit(`comment:${user.id}`, 60, 60 * 60 * 1000).ok) return { error: "Slow down a little." };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { examId, teacherId, parentId, body } = parsed.data;
  if (!examId && !teacherId) return { error: "Nothing to comment on." };

  const exam = examId ? await db.exam.findFirst({ where: { id: examId, schoolId: user.schoolId, status: "LIVE" }, include: { teacher: true } }) : null;
  const teacher = teacherId ? await db.teacher.findFirst({ where: { id: teacherId, schoolId: user.schoolId } }) : null;
  if ((examId && !exam) || (teacherId && !teacher)) return { error: "Not found." };
  const parent = parentId ? await db.comment.findFirst({ where: { id: parentId, schoolId: user.schoolId, examId, teacherId } }) : null;
  if (parentId && !parent) return { error: "That comment no longer exists." };

  const comment = await db.comment.create({
    data: { schoolId: user.schoolId, authorId: user.id, examId, teacherId, parentId: parent?.id, body },
  });

  const href = exam ? `/exams/${exam.id}#comment-${comment.id}` : `/teachers/${teacher!.id}#comment-${comment.id}`;
  const preview = body.slice(0, 200);
  if (parent) {
    await notify(parent.authorId, user.id, "comment.reply", { title: `${user.displayName} replied to your comment`, body: preview, href });
  }
  if (exam?.uploaderId && (!parent || parent.authorId !== exam.uploaderId)) {
    await notify(exam.uploaderId, user.id, "exam.comment", { title: `${user.displayName} commented on your exam`, body: preview, href });
  }
  revalidatePath(exam ? `/exams/${exam.id}` : `/teachers/${teacher!.id}`);
  return { success: "Posted." };
}

export async function deleteComment(commentId: string) {
  const user = await requireUser();
  const comment = await db.comment.findFirst({ where: { id: commentId, schoolId: user.schoolId } });
  if (!comment || (comment.authorId !== user.id && user.role !== "ADMIN")) return;
  await db.comment.update({ where: { id: commentId }, data: { deletedAt: new Date(), body: "" } });
  if (user.role === "ADMIN" && comment.authorId !== user.id) {
    await db.auditLog.create({ data: { actorId: user.id, action: "comment.delete", targetType: "Comment", targetId: commentId } });
  }
  revalidatePath(comment.examId ? `/exams/${comment.examId}` : `/teachers/${comment.teacherId}`);
}
