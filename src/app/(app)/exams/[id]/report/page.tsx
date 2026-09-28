import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { kindLabel, termLabel } from "@/lib/normalize";
import { ReportForm } from "./report-form";

export const metadata = { title: "Report" };

export default async function ReportPage({ params }: PageProps<"/exams/[id]/report">) {
  const user = await requireUser();
  const { id } = await params;
  const exam = await db.exam.findFirst({ where: { id, schoolId: user.schoolId }, include: { course: true, teacher: true } });
  if (!exam) notFound();
  return (
    <div className="mx-auto grid max-w-lg gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Report this exam</h1>
        <p className="text-muted-foreground">
          <Link href={`/exams/${exam.id}`} className="underline">{exam.course.code} · {termLabel(exam.term)} {exam.year} {kindLabel(exam.kind)} · {exam.teacher.displayName}</Link>
        </p>
      </div>
      <ReportForm examId={exam.id} />
      <p className="text-xs text-muted-foreground">
        Instructors and rights holders can also use the <Link href="/takedown" className="underline">takedown page</Link> without an account.
      </p>
    </div>
  );
}
