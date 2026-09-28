"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { mergeCourses, mergeTeachers, renameCourse, renameTeacher } from "@/lib/moderation/actions";

type T = { id: string; displayName: string; exams: number };
type C = { id: string; code: string; title: string; exams: number };

export function CatalogTables({ teachers, courses }: { teachers: T[]; courses: C[] }) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <TeacherPanel teachers={teachers} />
      <CoursePanel courses={courses} />
    </div>
  );
}

function TeacherPanel({ teachers }: { teachers: T[] }) {
  const [mergeState, mergeAction] = useActionState(mergeTeachers, undefined);
  const [renameState, renameAction] = useActionState(renameTeacher, undefined);
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teachers ({teachers.length})</CardTitle>
        <CardDescription>Merge duplicates (&ldquo;J. Smith&rdquo; and &ldquo;Jane Smith&rdquo;) so their exams appear together.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form action={mergeAction} className="grid gap-2 rounded-md border p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <SelectField name="fromId" label="Merge this" options={teachers.map((t) => [t.id, `${t.displayName} (${t.exams})`])} />
            <SelectField name="intoId" label="into this" options={teachers.map((t) => [t.id, `${t.displayName} (${t.exams})`])} />
          </div>
          <FormMessage error={mergeState?.error} success={mergeState?.success} />
          <div><SubmitButton size="sm" variant="outline" pendingText="Merging…">Merge teachers</SubmitButton></div>
        </form>
        <FormMessage error={renameState?.error} success={renameState?.success} />
        <ul className="max-h-[28rem] divide-y overflow-auto rounded-md border text-sm">
          {teachers.map((t) => (
            <li key={t.id} className="flex items-center gap-2 px-3 py-2">
              {editing === t.id ? (
                <form action={renameAction} className="flex flex-1 gap-2" onSubmit={() => setEditing(null)}>
                  <input type="hidden" name="id" value={t.id} />
                  <Input name="displayName" defaultValue={t.displayName} className="h-8" autoFocus />
                  <SubmitButton size="sm">Save</SubmitButton>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                </form>
              ) : (
                <>
                  <span className="flex-1">{t.displayName}</span>
                  <span className="text-xs text-muted-foreground">{t.exams} exam{t.exams === 1 ? "" : "s"}</span>
                  <Button size="xs" variant="ghost" onClick={() => setEditing(t.id)}>Rename</Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function CoursePanel({ courses }: { courses: C[] }) {
  const [mergeState, mergeAction] = useActionState(mergeCourses, undefined);
  const [renameState, renameAction] = useActionState(renameCourse, undefined);
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Courses ({courses.length})</CardTitle>
        <CardDescription>Fix codes and titles, or merge duplicates.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form action={mergeAction} className="grid gap-2 rounded-md border p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <SelectField name="fromId" label="Merge this" options={courses.map((c) => [c.id, `${c.code} (${c.exams})`])} />
            <SelectField name="intoId" label="into this" options={courses.map((c) => [c.id, `${c.code} (${c.exams})`])} />
          </div>
          <FormMessage error={mergeState?.error} success={mergeState?.success} />
          <div><SubmitButton size="sm" variant="outline" pendingText="Merging…">Merge courses</SubmitButton></div>
        </form>
        <FormMessage error={renameState?.error} success={renameState?.success} />
        <ul className="max-h-[28rem] divide-y overflow-auto rounded-md border text-sm">
          {courses.map((c) => (
            <li key={c.id} className="flex items-center gap-2 px-3 py-2">
              {editing === c.id ? (
                <form action={renameAction} className="flex flex-1 flex-wrap gap-2" onSubmit={() => setEditing(null)}>
                  <input type="hidden" name="id" value={c.id} />
                  <Input name="code" defaultValue={c.code} className="h-8 w-28" autoFocus />
                  <Input name="title" defaultValue={c.title} className="h-8 flex-1" />
                  <SubmitButton size="sm">Save</SubmitButton>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                </form>
              ) : (
                <>
                  <span className="w-24 font-medium">{c.code}</span>
                  <span className="flex-1 truncate text-muted-foreground">{c.title}</span>
                  <span className="text-xs text-muted-foreground">{c.exams}</span>
                  <Button size="xs" variant="ghost" onClick={() => setEditing(c.id)}>Edit</Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function SelectField({ name, label, options }: { name: string; label: string; options: [string, string][] }) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={`${name}-${label}`} className="text-xs">{label}</Label>
      <select id={`${name}-${label}`} name={name} required defaultValue="" className="h-8 rounded-md border bg-background px-2 text-sm">
        <option value="" disabled>Choose…</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
