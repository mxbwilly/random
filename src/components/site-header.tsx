import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { unreadCount } from "@/lib/notifications/notify";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";
import { MobileNav } from "./mobile-nav";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const verified = Boolean(user?.emailVerifiedAt);
  const unread = user && verified ? await unreadCount(user.id) : 0;
  const links = verified
    ? [
        { href: "/dashboard", label: "Home" },
        { href: "/search", label: "Search" },
        { href: "/requests", label: "Requests" },
        { href: "/upload", label: "Upload" },
        ...(user?.role === "ADMIN" ? [{ href: "/admin/reports", label: "Admin" }] : []),
      ]
    : [];

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 md:gap-4">
        {verified && <MobileNav links={links} appName={env.appName} />}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <GraduationCap className="size-5" />
          <span>{env.appName}</span>
        </Link>
        {verified && (
          <nav className="hidden items-center gap-1 text-sm md:flex">
            {links.filter((l) => l.href !== "/dashboard").map((l) => (
              <Button key={l.href} asChild variant="ghost" size="sm"><Link href={l.href}>{l.label}</Link></Button>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-1 md:gap-2">
          {verified && <NotificationBell initialCount={unread} />}
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
