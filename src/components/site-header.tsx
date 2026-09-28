import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { UserMenu } from "./user-menu";
import { unreadCount } from "@/lib/notifications/notify";
import { Bell } from "lucide-react";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user?.emailVerifiedAt ? await unreadCount(user.id) : 0;
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <GraduationCap className="size-5" />
          <span>{env.appName}</span>
        </Link>
        {user?.emailVerifiedAt && (
          <nav className="hidden items-center gap-1 text-sm md:flex">
            <Button asChild variant="ghost" size="sm"><Link href="/search">Search</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link href="/requests">Requests</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link href="/upload">Upload</Link></Button>
            {user.role === "ADMIN" && (
              <Button asChild variant="ghost" size="sm"><Link href="/admin/reports">Admin</Link></Button>
            )}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-2">
          {user?.emailVerifiedAt && (
            <Button asChild variant="ghost" size="icon" aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}>
              <Link href="/notifications" className="relative">
                <Bell />
                {unread > 0 && <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">{unread > 9 ? "9+" : unread}</span>}
              </Link>
            </Button>
          )}
          {user ? (
            <UserMenu displayName={user.displayName} email={user.email} schoolName={user.school.name} />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link href="/login">Log in</Link></Button>
              <Button asChild size="sm"><Link href="/signup">Sign up</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
