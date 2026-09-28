"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { replyToRequest, setRequestStatus } from "@/lib/requests/actions";

export function ReplyForm({ requestId }: { requestId: string }) {
  const [state, action] = useActionState(replyToRequest, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <Textarea name="body" required maxLength={2000} rows={3} placeholder="I have the 2020 final, uploading now… / Ask in the class Discord, someone posted it there…" />
      <FormMessage error={state?.error} />
      <div><SubmitButton size="sm" pendingText="Posting…">Reply</SubmitButton></div>
    </form>
  );
}

export function StatusButtons({ requestId, status }: { requestId: string; status: "OPEN" | "FULFILLED" | "CLOSED" }) {
  const [pending, start] = useTransition();
  if (status === "OPEN") {
    return <Button variant="outline" disabled={pending} onClick={() => start(() => setRequestStatus(requestId, "CLOSED"))}>Close request</Button>;
  }
  return <Button variant="outline" disabled={pending} onClick={() => start(() => setRequestStatus(requestId, "OPEN"))}>Reopen</Button>;
}
