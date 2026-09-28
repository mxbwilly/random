import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { kindLabel, termLabel } from "@/lib/normalize";
import { timeAgo } from "@/lib/time";

export type RequestCardData = {
  id: string;
  message: string;
  status: "OPEN" | "FULFILLED" | "CLOSED";
  year: number | null;
  term: string | null;
  kind: string | null;
  createdAt: Date;
  course: { id: string; code: string } | null;
  teacher: { id: string; displayName: string } | null;
  requester: { displayName: string; major: string | null };
  _count: { replies: number };
};

export function requestHeadline(r: Pick<RequestCardData, "course" | "teacher" | "year" | "term" | "kind">) {
  const parts = [
    r.course?.code,
    r.teacher?.displayName,
    [r.term && termLabel(r.term), r.year].filter(Boolean).join(" ") || null,
    r.kind && kindLabel(r.kind),
  ].filter(Boolean);
  return parts.join(" · ") || "Any exam";
}

const STATUS: Record<RequestCardData["status"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  OPEN: { label: "Open", variant: "default" },
  FULFILLED: { label: "Fulfilled", variant: "secondary" },
  CLOSED: { label: "Closed", variant: "outline" },
};

export function RequestCard({ r }: { r: RequestCardData }) {
  return (
    <li>
      <Link href={`/requests/${r.id}`} className="block rounded-md border p-4 transition-colors hover:bg-muted/50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium">{requestHeadline(r)}</div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.message}</p>
          </div>
          <Badge variant={STATUS[r.status].variant}>{STATUS[r.status].label}</Badge>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {r.requester.displayName}{r.requester.major && ` · ${r.requester.major}`} · {timeAgo(r.createdAt)} · {r._count.replies} repl{r._count.replies === 1 ? "y" : "ies"}
        </div>
      </Link>
    </li>
  );
}
