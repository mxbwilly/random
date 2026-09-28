import { db } from "@/lib/db";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";

type Target = { examId: string } | { teacherId: string };

/** Server component: threaded comments (one level of replies) for an exam or teacher. */
export async function Comments({ target, currentUserId, isAdmin }: { target: Target; currentUserId: string; isAdmin: boolean }) {
  const where = "examId" in target ? { examId: target.examId } : { teacherId: target.teacherId };
  const all = await db.comment.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, displayName: true, major: true } } },
  });
  const roots = all.filter((c) => !c.parentId);
  const repliesFor = (id: string) => all.filter((c) => c.parentId === id);
  const visibleCount = all.filter((c) => !c.deletedAt).length;

  return (
    <section id="comments" className="grid gap-4">
      <h2 className="text-lg font-semibold">{visibleCount} comment{visibleCount === 1 ? "" : "s"}</h2>
      <CommentForm target={target} placeholder={"examId" in target ? "Was this the real exam? Anything the next student should know?" : "Tips about this teacher's exams: format, what they reuse, what to focus on."} />
      <ul className="grid gap-4">
        {roots.map((c) => (
          <CommentItem key={c.id} comment={c} replies={repliesFor(c.id)} target={target} currentUserId={currentUserId} isAdmin={isAdmin} />
        ))}
      </ul>
    </section>
  );
}
