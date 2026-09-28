import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { requestHeadline } from "@/components/requests/request-card";
import { timeAgo } from "@/lib/time";
import { kindLabel, termLabel } from "@/lib/normalize";
import { ReplyForm, StatusButtons } from "./request-controls";

export default async function RequestPage({ params }: PageProps<"/requests/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const r = await db.examRequest.findFirst({
    where: { id, schoolId: user.schoolId },
    include: {
      course: true,
      teacher: true,
      requester: { select: { id: true, displayName: true, major: true } },
      fulfilledByExam: { include: { course: true, teacher: true } },
      replies: { orderBy: { createdAt: "asc" }, include: { author: { select: { displayName: true, major: true } } } },
    },
  });
  if (!r) notFound();
  const isOwner = r.requesterId === user.id;
  const uploadHref = `/upload?requestId=${r.id}${r.courseId ? `&courseId=${r.courseId}` : ""}${r.teacherId ? `&teacherId=${r.teacherId}` : ""}`;

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <Link href="/requests" className="text-sm text-muted-foreground hover:underline">← All requests</Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold">{requestHeadline(r)}</h1>
          <Badge variant={r.status === "OPEN" ? "default" : "secondary"}>{r.status === "OPEN" ? "Open" : r.status === "FULFILLED" ? "Fulfilled" : "Closed"}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Asked by {r.requester.displayName}{r.requester.major && ` · ${r.requester.major}`} · {timeAgo(r.createdAt)}
          {r.course && <> · <Link href={`/courses/${r.course.id}`} className="underline">{r.course.code}</Link></>}
          {r.teacher && <> · <Link href={`/teachers/${r.teacher.id}`} className="underline">{r.teacher.displayName}</Link></>}
        </p>
      </div>

      <p className="rounded-md border p-4 whitespace-pre-wrap">{r.message}</p>

      {r.fulfilledByExam && (
        <div className="rounded-md border border-green-600/40 bg-green-600/5 p-4 text-sm">
          Fulfilled by{" "}
          <Link href={`/exams/${r.fulfilledByExam.id}`} className="font-medium underline">
            {r.fulfilledByExam.course.code} · {termLabel(r.fulfilledByExam.term)} {r.fulfilledByExam.year} {kindLabel(r.fulfilledByExam.kind)} · {r.fulfilledByExam.teacher.displayName}
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {r.status === "OPEN" && <Button asChild><Link href={uploadHref}>I have it — upload for this request</Link></Button>}
        {(isOwner || user.role === "ADMIN") && <StatusButtons requestId={r.id} status={r.status} />}
      </div>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">{r.replies.length} repl{r.replies.length === 1 ? "y" : "ies"}</h2>
        <ul className="grid gap-3">
          {r.replies.map((reply) => (
            <li key={reply.id} className="rounded-md border p-3 text-sm">
              <div className="mb-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{reply.author.displayName}</span>
                {reply.author.major && ` · ${reply.author.major}`} · {timeAgo(reply.createdAt)}
              </div>
              <p className="whitespace-pre-wrap">{reply.body}</p>
            </li>
          ))}
        </ul>
        <ReplyForm requestId={r.id} />
      </section>
    </div>
  );
}
