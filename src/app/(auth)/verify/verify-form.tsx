"use client";

import { useActionState, useState, useTransition } from "react";
import { resendVerification, verifyEmail } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { logout } from "../actions";

export function VerifyForm({ email }: { email: string }) {
  const [state, action] = useActionState(verifyEmail, undefined);
  const [resendState, setResendState] = useState<{ error?: string; success?: string }>();
  const [resending, startResend] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. Enter it below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Verification code</Label>
            <Input id="code" name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" required className="text-center text-lg tracking-[0.5em]" />
          </div>
          <FormMessage error={state?.error} />
          <FormMessage error={resendState?.error} success={resendState?.success} />
          <SubmitButton className="w-full" pendingText="Verifying…">Verify</SubmitButton>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <Button type="button" variant="link" className="px-0" disabled={resending}
            onClick={() => startResend(async () => setResendState(await resendVerification()))}>
            {resending ? "Sending…" : "Resend code"}
          </Button>
          <Button type="button" variant="link" className="px-0 text-muted-foreground" onClick={() => logout()}>
            Use a different email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
