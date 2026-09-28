import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";

export type NotificationType = "request.reply" | "request.fulfilled" | "exam.comment" | "comment.reply" | "teacher.comment";

export type NotificationPayload = {
  title: string; // "Sam replied to your request"
  body?: string; // first line of the reply
  href: string; // where clicking takes you
};

/**
 * Stores an in-app notification and emails it. Never notifies the actor
 * about their own action. Email failures are logged, not raised.
 */
export async function notify(userId: string, actorId: string | null, type: NotificationType, payload: NotificationPayload) {
  if (userId === actorId) return;
  const [user, notification] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { email: true, displayName: true } }),
    db.notification.create({ data: { userId, type, payload } }),
  ]);
  if (!user) return;
  const url = `${env.appUrl}${payload.href}`;
  const result = await sendEmail({
    to: user.email,
    subject: payload.title,
    text: `${payload.title}\n\n${payload.body ? payload.body + "\n\n" : ""}Open it: ${url}\n\nYou're receiving this because of activity on ${env.appName}. Manage notifications in Settings: ${env.appUrl}/settings`,
  }).catch(() => ({ ok: false }));
  if (result.ok) await db.notification.update({ where: { id: notification.id }, data: { emailedAt: new Date() } });
}

export async function unreadCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}
