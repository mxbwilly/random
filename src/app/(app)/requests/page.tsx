import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/requests/request-card";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata = { title: "Requests" };

const FILTERS = [
  { key: "open", label: "Open", where: { status: "OPEN" as const } },
  { key: "mine", label: "Mine", where: null },
  { key: "all", label: "All", where: {} },
];

export default async function RequestsPage({ searchParams }: PageProps<"/requests">) {
  const user = await requireUser();
  const { filter } = await searchParams;
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const requests = await db.examRequest.findMany({
    where: { schoolId: user.schoolId, ...(active.key === "mine" ? { requesterId: user.id } : active.where) },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { course: true, teacher: true, requester: { select: { displayName: true, major: true } }, _count: { select: { replies: true } } },
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Exam requests</h1>
          <p className="text-muted-foreground">Looking for something that isn&apos;t uploaded yet? Ask. Have it? Reply or upload it.</p>
        </div>
        <Button asChild><Link href="/requests/new">New request</Link></Button>
      </div>
      <div className="flex gap-1 border-b">
        {FILTERS.map((f) => (
          <Link key={f.key} href={`/requests?filter=${f.key}`}
            className={cn("-mb-px border-b-2 px-3 py-2 text-sm", f.key === active.key ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {f.label}
          </Link>
        ))}
      </div>
      {requests.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No requests here yet.</p>
      ) : (
        <ul className="grid gap-3">{requests.map((r) => <RequestCard key={r.id} r={r} />)}</ul>
      )}
    </div>
  );
}
