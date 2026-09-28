import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink, FileText, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { kindLabel, termLabel } from "@/lib/normalize";
import { VoteButtons } from "./vote-buttons";
import { DeleteExamButton } from "./delete-button";

export default async function ExamPage({ params }: PageProps<"/exams/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const exam = await db.exam.findFirst({
    where: { id, schoolId: user.schoolId },
    include: {
      course: true,
      teacher: true,
      uploader: { select: { id: true, displayName: true } },
      files: { orderBy: [{ kind: "asc" }, { createdAt: "asc" }] },
      votes: true,
    },
  });
  const isOwner = exam?.uploaderId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!exam || (exam.status !== "LIVE" && !isOwner && !isAdmin)) notFound();

  const score = exam.votes.reduce((s, v) => s + v.value, 0);
  const myVote = exam.votes.find((v) => v.userId === user.id)?.value ?? 0;
  const examFiles = exam.files.filter((f) => f.kind === "EXAM");
  const solutionFiles = exam.files.filter((f) => f.kind === "SOLUTIONS");
  const preview = examFiles.find((f) => f.mimeType === "application/pdf") ?? examFiles.find((f) => f.mimeType.startsWith("image/"));
  const uploaderName = exam.anonymous && !isAdmin && !isOwner ? "a student" : exam.uploader?.displayName ?? "a former member";

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link href={`/courses/${exam.course.id}`} className="hover:underline">{exam.course.code} · {exam.course.title}</Link>
          </div>
          <h1 className="text-2xl font-semibold">
            {termLabel(exam.term)} {exam.year} {kindLabel(exam.kind)}
            {exam.title && <span className="text-muted-foreground"> · {exam.title}</span>}
          </h1>
          <p className="text-muted-foreground">
            Taught by <Link href={`/teachers/${exam.teacher.id}`} className="font-medium text-foreground hover:underline">{exam.teacher.displayName}</Link>
            {" · "}uploaded by {uploaderName}{isOwner && exam.anonymous && " (you, anonymously)"} on {exam.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            {" · "}{exam.downloadCount} download{exam.downloadCount === 1 ? "" : "s"}
          </p>
          {exam.status !== "LIVE" && <Badge variant="destructive" className="mt-2">{exam.status === "HIDDEN" ? "Hidden (only you and admins can see this)" : "Removed"}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <VoteButtons examId={exam.id} score={score} myVote={myVote} />
          <Button asChild variant="outline" size="sm"><Link href={`/exams/${exam.id}/report`}>Report</Link></Button>
          {(isOwner || isAdmin) && <DeleteExamButton examId={exam.id} />}
        </div>
      </div>

      {exam.notes && <p className="rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-wrap">{exam.notes}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="order-2 lg:order-1">
          {preview ? (
            preview.mimeType === "application/pdf" ? (
              <iframe src={`/api/files/${preview.id}#toolbar=0`} title={preview.originalName} className="h-[75vh] w-full rounded-md border bg-white" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/files/${preview.id}`} alt={preview.originalName} className="w-full rounded-md border" />
            )
          ) : (
            <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No preview available.</p>
          )}
        </div>
        <aside className="order-1 grid gap-4 self-start lg:order-2">
          <FileGroup title="Exam" icon={<FileText className="size-4" />} files={examFiles} />
          {solutionFiles.length > 0 && <FileGroup title="Solutions" icon={<KeyRound className="size-4" />} files={solutionFiles} />}
        </aside>
      </div>
    </div>
  );
}

function FileGroup({ title, icon, files }: { title: string; icon: React.ReactNode; files: { id: string; originalName: string; sizeBytes: number }[] }) {
  return (
    <section className="rounded-md border">
      <h2 className="flex items-center gap-2 border-b px-4 py-2 text-sm font-semibold">{icon}{title}</h2>
      <ul className="divide-y">
        {files.map((f) => (
          <li key={f.id} className="flex items-center gap-2 px-4 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate" title={f.originalName}>{f.originalName}</span>
            <span className="text-xs text-muted-foreground">{formatBytes(f.sizeBytes)}</span>
            <Button asChild variant="ghost" size="icon-sm" aria-label="Open"><a href={`/api/files/${f.id}`} target="_blank" rel="noopener"><ExternalLink /></a></Button>
            <Button asChild variant="ghost" size="icon-sm" aria-label="Download"><a href={`/api/files/${f.id}?dl=1`}><Download /></a></Button>
          </li>
        ))}
        {files.length === 0 && <li className="px-4 py-2 text-sm text-muted-foreground">No file attached yet.</li>}
      </ul>
    </section>
  );
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
