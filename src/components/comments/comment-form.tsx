"use client";

import { useActionState, useEffect, useRef } from "react";
import { addComment } from "@/lib/comments/actions";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

export function CommentForm({
  target,
  parentId,
  placeholder,
  compact,
  onDone,
}: {
  target: { examId: string } | { teacherId: string };
  parentId?: string;
  placeholder: string;
  compact?: boolean;
  onDone?: () => void;
}) {
  const [state, action] = useActionState(addComment, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onDone?.();
    }
  }, [state, onDone]);
  return (
    <form ref={formRef} action={action} className="grid gap-2">
      {"examId" in target ? <input type="hidden" name="examId" value={target.examId} /> : <input type="hidden" name="teacherId" value={target.teacherId} />}
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <Textarea name="body" required maxLength={2000} placeholder={placeholder} rows={compact ? 2 : 3} />
      <FormMessage error={state?.error} />
      <div><SubmitButton size="sm" pendingText="Posting…">{parentId ? "Reply" : "Comment"}</SubmitButton></div>
    </form>
  );
}
