"use client";

import { useOptimistic, useTransition } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { voteExam } from "@/lib/exams/actions";
import { cn } from "@/lib/utils";

export function VoteButtons({ examId, score, myVote }: { examId: string; score: number; myVote: number }) {
  const [pending, start] = useTransition();
  const [state, setOptimistic] = useOptimistic({ score, myVote });

  function vote(v: 1 | -1) {
    const next = state.myVote === v ? 0 : v;
    start(async () => {
      setOptimistic({ score: state.score - state.myVote + next, myVote: next });
      await voteExam(examId, next);
    });
  }

  return (
    <div className="flex items-center rounded-md border" title="Was this exam accurate and useful?">
      <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => vote(1)} className={cn(state.myVote === 1 && "text-green-600")} aria-label="Helpful">
        <ThumbsUp />
      </Button>
      <span className="min-w-6 text-center text-sm tabular-nums">{state.score}</span>
      <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => vote(-1)} className={cn(state.myVote === -1 && "text-destructive")} aria-label="Not helpful">
        <ThumbsDown />
      </Button>
    </div>
  );
}
