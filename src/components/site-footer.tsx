import Link from "next/link";
import { env } from "@/lib/env";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t py-6 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4">
        <span>{env.appName} is student-run and not affiliated with any school.</span>
        <nav className="flex gap-4">
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/takedown" className="hover:underline">Takedown requests</Link>
        </nav>
      </div>
    </footer>
  );
}
