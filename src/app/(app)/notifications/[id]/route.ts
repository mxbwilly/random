import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import type { NotificationPayload } from "@/lib/notifications/notify";

/** Marks one notification read, then redirects to its target. */
export async function GET(request: NextRequest, { params }: RouteContext<"/notifications/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  const { id } = await params;
  const n = await db.notification.findFirst({ where: { id, userId: user.id } });
  if (!n) return NextResponse.redirect(new URL("/notifications", request.url));
  if (!n.readAt) await db.notification.update({ where: { id }, data: { readAt: new Date() } });
  const href = (n.payload as NotificationPayload).href || "/notifications";
  return NextResponse.redirect(new URL(href, request.url));
}
