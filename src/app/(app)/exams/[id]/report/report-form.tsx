"use client";

import { useActionState } from "react";
import { submitReport } from "@/lib/moderation/actions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

const REASONS = [
  ["COPYRIGHT", "It shouldn't be shared", "The instructor prohibits sharing, it's a current exam, or it's copyrighted material."],
  ["WRONG_INFO", "Wrong course, teacher or term", "The file doesn't match its labels."],
  ["INAPPROPRIATE", "Inappropriate or personal content", "Contains a student's name, grades, or something unrelated."],
  ["OTHER", "Something else", ""],
] as const;

export function ReportForm({ examId, commentId }: { examId?: string; commentId?: string }) {
  const [state, action] = useActionState(submitReport, undefined);
  if (state?.success) return <FormMessage success={state.success} />;
  return (
    <form action={action} className="grid gap-5">
      {examId && <input type="hidden" name="examId" value={examId} />}
      {commentId && <input type="hidden" name="commentId" value={commentId} />}
      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-medium">Reason</legend>
        {REASONS.map(([value, label, help]) => (
          <label key={value} className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm has-[:checked]:border-foreground">
            <input type="radio" name="reason" value={value} required className="mt-1" />
            <span>
              <span className="font-medium">{label}</span>
              {help && <span className="block text-muted-foreground">{help}</span>}
            </span>
          </label>
        ))}
      </fieldset>
      <div className="grid gap-2">
        <Label htmlFor="details">Details <span className="text-muted-foreground">(optional unless &quot;something else&quot;)</span></Label>
        <Textarea id="details" name="details" maxLength={2000} rows={3} />
      </div>
      <FormMessage error={state?.error} />
      <div><SubmitButton pendingText="Sending…">Send report</SubmitButton></div>
    </form>
  );
}
