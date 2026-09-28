"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

export default function SignupPage() {
  const [state, action] = useActionState(signup, undefined);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Sign up with your school email. We&apos;ll send a code to confirm it.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">School email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@school.edu" defaultValue={state?.values?.email} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="displayName">Name</Label>
            <Input id="displayName" name="displayName" autoComplete="name" required placeholder="How you'll appear to others" defaultValue={state?.values?.displayName} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="major">Major <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="major" name="major" placeholder="e.g. Computer Science" defaultValue={state?.values?.major} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} />
            <p className="text-xs text-muted-foreground">At least 10 characters.</p>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox id="acceptTerms" name="acceptTerms" required className="mt-0.5" />
            <Label htmlFor="acceptTerms" className="text-sm font-normal leading-snug">
              I agree to the <Link href="/terms" className="underline" target="_blank">Terms</Link> and{" "}
              <Link href="/privacy" className="underline" target="_blank">Privacy Policy</Link>.
            </Label>
          </div>
          <FormMessage error={state?.error} />
          <SubmitButton className="w-full" pendingText="Creating account…">Sign up</SubmitButton>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="underline">Log in</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
