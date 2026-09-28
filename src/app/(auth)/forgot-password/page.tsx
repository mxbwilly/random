"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPassword } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(forgotPassword, undefined);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Enter your school email and we&apos;ll send a code.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">School email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} />
          </div>
          <FormMessage error={state?.error} />
          <SubmitButton className="w-full" pendingText="Sending…">Send code</SubmitButton>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="underline">Back to log in</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
