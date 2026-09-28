"use client";

import { useActionState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { createSchool, updateSchoolDomains } from "@/lib/moderation/actions";

export function NewSchoolForm() {
  const [state, action] = useActionState(createSchool, undefined);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a school</CardTitle>
        <CardDescription>Students sign up with an email on one of these domains. Subdomains are accepted automatically (cs.school.edu matches school.edu).</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <div className="grid gap-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" required placeholder="State University" /></div>
          <div className="grid gap-2"><Label htmlFor="slug">Slug</Label><Input id="slug" name="slug" required pattern="[a-z0-9-]{2,60}" placeholder="state-university" /></div>
          <div className="grid gap-2"><Label htmlFor="emailDomains">Email domains</Label><Input id="emailDomains" name="emailDomains" required placeholder="state.edu, mail.state.edu" /></div>
          <FormMessage error={state?.error} success={state?.success} />
          <div><SubmitButton pendingText="Adding…">Add school</SubmitButton></div>
        </form>
      </CardContent>
    </Card>
  );
}

export function SchoolRow({ school }: { school: { id: string; name: string; slug: string; emailDomains: string[]; users: number; exams: number } }) {
  const [state, action] = useActionState(updateSchoolDomains, undefined);
  return (
    <li className="grid gap-2 rounded-md border p-4 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{school.name}</span>
        <span className="text-xs text-muted-foreground">{school.users} users · {school.exams} exams · /{school.slug}</span>
      </div>
      <form action={action} className="flex gap-2">
        <input type="hidden" name="id" value={school.id} />
        <Input name="emailDomains" defaultValue={school.emailDomains.join(", ")} className="h-8" aria-label="Email domains" />
        <SubmitButton size="sm" variant="outline">Save</SubmitButton>
      </form>
      <FormMessage error={state?.error} success={state?.success} />
    </li>
  );
}
