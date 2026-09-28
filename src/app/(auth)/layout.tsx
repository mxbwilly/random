import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { env } from "@/lib/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-semibold">
        <GraduationCap className="size-6" />
        {env.appName}
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
