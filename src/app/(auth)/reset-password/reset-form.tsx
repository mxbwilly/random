"use client";

import { useActionState } from "react";
import { resetPassword } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

export function ResetForm({ email }: { email: string }) {
  const [state, action] = useActionState(resetPassword, undefined);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>If an account exists for that email, a 6-digit code is on its way.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">School email</Label>
            <Input id="email" name="email" type="email" defaultValue={state?.values?.email ?? email} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} />
          </div>
          <FormMessage error={state?.error} />
          <SubmitButton className="w-full" pendingText="Saving…">Set password</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
