"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resolveReport, restoreExam } from "@/lib/moderation/actions";

export function ReportActions({ reportId, kind }: { reportId: string; kind: "exam" | "comment" }) {
  const [pending, start] = useTransition();
  const act = (o: Parameters<typeof resolveReport>[1]) => () => start(() => resolveReport(reportId, o));
  return (
    <div className="flex flex-wrap gap-2">
      {kind === "exam" ? (
        <>
          <Button size="sm" variant="outline" disabled={pending} onClick={act("HIDE")}>Hide exam</Button>
          <Button size="sm" variant="destructive" disabled={pending} onClick={act("REMOVE")}>Remove files permanently</Button>
        </>
      ) : (
        <Button size="sm" variant="destructive" disabled={pending} onClick={act("DELETE_COMMENT")}>Delete comment</Button>
      )}
      <Button size="sm" variant="ghost" disabled={pending} onClick={act("DISMISS")}>Dismiss</Button>
    </div>
  );
}

export function RestoreButton({ examId }: { examId: string }) {
  const [pending, start] = useTransition();
  return <Button size="sm" variant="outline" disabled={pending} onClick={() => start(() => restoreExam(examId))}>Restore</Button>;
}
