import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { kindLabel, termLabel } from "@/lib/normalize";
import { timeAgo } from "@/lib/time";
import { ReportActions, RestoreButton } from "./report-actions";

export const metadata = { title: "Reports" };

const REASON: Record<string, string> = { COPYRIGHT: "Shouldn't be shared", WRONG_INFO: "Wrong labels", INAPPROPRIATE: "Inappropriate", OTHER: "Other" };

export default async function AdminReportsPage() {
  const admin = await requireAdmin();
  const [reports, hidden] = await Promise.all([
    db.report.findMany({
      where: { status: "OPEN", OR: [{ exam: { schoolId: admin.schoolId } }, { comment: { schoolId: admin.schoolId } }] },
      orderBy: { createdAt: "asc" },
      include: {
        reporter: { select: { displayName: true, email: true } },
        exam: { include: { course: true, teacher: true, uploader: { select: { displayName: true, email: true } } } },
        comment: { include: { author: { select: { displayName: true, email: true } } } },
      },
    }),
    db.exam.findMany({ where: { schoolId: admin.schoolId, status: "HIDDEN", files: { some: {} } }, include: { course: true, teacher: true }, orderBy: { updatedAt: "desc" }, take: 20 }),
  ]);

  return (
    <div className="grid gap-8">
      <section className="grid gap-3">
        <h2 className="font-semibold">Open reports ({reports.length})</h2>
        {reports.length === 0 && <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">Queue is empty.</p>}
        {reports.map((r) => (
          <div key={r.id} className="grid gap-3 rounded-md border p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{REASON[r.reason]}</Badge>
              <span className="text-muted-foreground">reported by {r.reporter?.displayName ?? "deleted user"} · {timeAgo(r.createdAt)}</span>
            </div>
            {r.exam && (
              <div>
                <Link href={`/exams/${r.exam.id}`} className="font-medium underline">
                  {r.exam.course.code} · {termLabel(r.exam.term)} {r.exam.year} {kindLabel(r.exam.kind)} · {r.exam.teacher.displayName}
                </Link>
                <div className="text-muted-foreground">
                  uploaded by {r.exam.uploader ? `${r.exam.uploader.displayName} <${r.exam.uploader.email}>` : "deleted user"} · status {r.exam.status}
                </div>
              </div>
            )}
            {r.comment && (
              <div>
                <div className="font-medium">Comment by {r.comment.author.displayName} &lt;{r.comment.author.email}&gt;</div>
                <p className="rounded bg-muted/40 p-2 whitespace-pre-wrap">{r.comment.deletedAt ? "(already deleted)" : r.comment.body}</p>
              </div>
            )}
            {r.details && <p className="rounded bg-muted/40 p-2 whitespace-pre-wrap">&ldquo;{r.details}&rdquo;</p>}
            <ReportActions reportId={r.id} kind={r.exam ? "exam" : "comment"} />
          </div>
        ))}
      </section>

      <section className="grid gap-3">
        <h2 className="font-semibold">Hidden exams</h2>
        {hidden.length === 0 && <p className="text-sm text-muted-foreground">None.</p>}
        <ul className="divide-y rounded-md border">
          {hidden.map((e) => (
            <li key={e.id} className="flex items-center gap-3 px-4 py-2 text-sm">
              <Link href={`/exams/${e.id}`} className="flex-1 underline">{e.course.code} · {termLabel(e.term)} {e.year} {kindLabel(e.kind)} · {e.teacher.displayName}</Link>
              <RestoreButton examId={e.id} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
