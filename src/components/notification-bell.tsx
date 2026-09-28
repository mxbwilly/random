"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const POLL_MS = 30_000;

/**
 * Bell with an unread badge. Starts from the server-rendered count, then
 * refreshes on navigation, when the tab regains focus, and every 30s.
 */
export function NotificationBell({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const res = await fetch("/api/notifications/unread", { cache: "no-store" });
        if (res.ok && active) setCount((await res.json()).count ?? 0);
      } catch {}
    };
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [pathname]);

  const label = count > 0 ? `Notifications, ${count} unread` : "Notifications";
  return (
    <Button asChild variant="ghost" size="icon" aria-label={label} title={label}>
      <Link href="/notifications" className="relative">
        <Bell />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white ring-2 ring-background">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
