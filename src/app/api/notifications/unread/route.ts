import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { unreadCount } from "@/lib/notifications/notify";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.emailVerifiedAt) return NextResponse.json({ count: 0 }, { status: 401 });
  return NextResponse.json({ count: await unreadCount(user.id) }, { headers: { "cache-control": "no-store" } });
}
