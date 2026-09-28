import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";

const TABS = [
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/catalog", label: "Catalog" },
  { href: "/admin/schools", label: "Schools" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <nav className="mt-2 flex gap-1 border-b">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className="-mb-px border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:border-foreground hover:text-foreground">{t.label}</Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
