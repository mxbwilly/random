import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { NotificationPayload } from "@/lib/notifications/notify";
import { MarkAllReadButton } from "./mark-read";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const unread = items.filter((n) => !n.readAt).length;
  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        {unread > 0 && <MarkAllReadButton />}
      </div>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Nothing yet. You&apos;ll hear when someone replies to your requests or comments on your uploads.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {items.map((n) => {
            const p = n.payload as NotificationPayload;
            return (
              <li key={n.id}>
                <Link href={`/notifications/${n.id}`} className={cn("block px-4 py-3 hover:bg-muted/50", !n.readAt && "bg-muted/30")}>
                  <div className="flex items-center gap-2">
                    {!n.readAt && <span className="size-2 rounded-full bg-primary" aria-label="Unread" />}
                    <span className="font-medium">{p.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </div>
                  {p.body && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.body}</p>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
