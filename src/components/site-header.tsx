import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const user = await getCurrentUser();
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
