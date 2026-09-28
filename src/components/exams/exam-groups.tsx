import Link from "next/link";
import { ExamList, type ExamListItem } from "./exam-list";
import type { Group } from "@/lib/exams/group";

export function ExamGroups({ groups, hrefPrefix }: { groups: Group<ExamListItem>[]; hrefPrefix: "/courses" | "/teachers" }) {
  if (groups.length === 0) return <p className="text-sm text-muted-foreground">No exams have been uploaded yet.</p>;
  return (
    <div className="grid gap-8">
      {groups.map((g) => (
        <section key={g.id}>
          <h2 className="mb-2 text-lg font-semibold">
            <Link href={`${hrefPrefix}/${g.id}`} className="hover:underline">{g.name}</Link>
            {g.sub && <span className="ml-2 text-sm font-normal text-muted-foreground">{g.sub}</span>}
          </h2>
          <ExamList exams={g.exams} />
        </section>
      ))}
    </div>
  );
}
