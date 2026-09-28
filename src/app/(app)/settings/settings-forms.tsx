"use client";

import { useActionState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { deleteAccount, updateProfile } from "@/lib/settings/actions";

export function ProfileForm({ displayName, major, gradYear }: { displayName: string; major: string; gradYear?: number }) {
  const [state, action] = useActionState(updateProfile, undefined);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Shown on your comments and requests. Uploads stay anonymous unless you chose otherwise.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="displayName">Name</Label>
            <Input id="displayName" name="displayName" defaultValue={displayName} required minLength={2} maxLength={60} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="major">Major</Label>
              <Input id="major" name="major" defaultValue={major} maxLength={80} placeholder="e.g. Economics" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gradYear">Graduation year</Label>
              <Input id="gradYear" name="gradYear" type="number" min={1950} max={2100} defaultValue={gradYear} />
            </div>
          </div>
          <FormMessage error={state?.error} success={state?.success} />
          <div><SubmitButton pendingText="Saving…">Save</SubmitButton></div>
        </form>
      </CardContent>
    </Card>
  );
}

export function DeleteAccount({ uploads }: { uploads: number }) {
  const [state, action] = useActionState(deleteAccount, undefined);
  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle>Delete account</CardTitle>
        <CardDescription>
          Your profile, comments, requests and notifications are deleted. Your {uploads} upload{uploads === 1 ? "" : "s"} stay available to other students, fully anonymous. Delete them first if you don&apos;t want that.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="confirm">Type <span className="font-mono">delete</span> to confirm</Label>
            <Input id="confirm" name="confirm" autoComplete="off" required />
          </div>
          <FormMessage error={state?.error} />
          <div><SubmitButton variant="destructive" pendingText="Deleting…">Delete my account</SubmitButton></div>
        </form>
      </CardContent>
    </Card>
  );
}
