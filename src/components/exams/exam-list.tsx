import Link from "next/link";
import { FileText, KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { kindLabel, termLabel } from "@/lib/normalize";
import type { Term } from "@/generated/prisma/enums";

export type ExamListItem = {
  id: string;
  year: number;
  term: Term;
  kind: string;
  title: string | null;
  hasSolutions: boolean;
  _count: { files: number };
};

export function ExamList({ exams }: { exams: ExamListItem[] }) {
  if (exams.length === 0) return <p className="text-sm text-muted-foreground">No exams yet.</p>;
  return (
    <ul className="divide-y rounded-md border">
      {exams.map((e) => (
        <li key={e.id}>
          <Link href={`/exams/${e.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="font-medium">
                {termLabel(e.term)} {e.year} · {kindLabel(e.kind)}
                {e.title && <span className="font-normal text-muted-foreground"> · {e.title}</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                {e._count.files === 0 ? "No file attached" : `${e._count.files} file${e._count.files === 1 ? "" : "s"}`}
              </div>
            </div>
            {e.hasSolutions && (
              <Badge variant="secondary" className="gap-1"><KeyRound className="size-3" />Solutions</Badge>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
