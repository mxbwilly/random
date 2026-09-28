"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

export default function LoginPage() {
  const [state, action] = useActionState(login, undefined);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Use your school email address.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">School email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@school.edu" defaultValue={state?.values?.email} />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-muted-foreground hover:underline">Forgot password?</Link>
            </div>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <FormMessage error={state?.error} />
          <SubmitButton className="w-full" pendingText="Logging in…">Log in</SubmitButton>
          <p className="text-center text-sm text-muted-foreground">
            New here? <Link href="/signup" className="underline">Create an account</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
