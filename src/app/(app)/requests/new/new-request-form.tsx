"use client";

import { useActionState, useCallback, useState } from "react";
import { createRequest } from "@/lib/requests/actions";
import { searchCoursesAction, searchTeachersAction } from "@/lib/catalog/actions";
import { EntityPicker, type PickerValue } from "@/components/upload/entity-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { CURRENT_YEAR, MIN_YEAR } from "@/lib/exams/files";

const YEARS = Array.from({ length: CURRENT_YEAR - MIN_YEAR + 1 }, (_, i) => CURRENT_YEAR - i);
const ANY = "any";

export function NewRequestForm({ initialCourse, initialTeacher }: { initialCourse: { id: string; label: string } | null; initialTeacher: { id: string; label: string } | null }) {
  const [state, action] = useActionState(createRequest, undefined);
  const [course, setCourse] = useState<PickerValue>(initialCourse);
  const [teacher, setTeacher] = useState<PickerValue>(initialTeacher);
  const searchCourses = useCallback(async (q: string) => (await searchCoursesAction(q)).map((c) => ({ id: c.id, label: c.code, sub: c.title, count: c.examCount })), []);
  const searchTeachers = useCallback(async (q: string) => (await searchTeachersAction(q)).map((t) => ({ id: t.id, label: t.displayName, sub: t.departmentCode ?? undefined, count: t.examCount })), []);

  // Requests reference existing catalog entries only; creating happens on upload.
  const courseId = course && "id" in course ? course.id : "";
  const teacherId = teacher && "id" in teacher ? teacher.id : "";

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="teacherId" value={teacherId} />
      <div className="grid gap-2">
        <Label>Course</Label>
        <EntityPicker value={course} onChange={(v) => setCourse(v && "create" in v ? null : v)} search={searchCourses} placeholder="Course code, e.g. CS 101" createLabel={(q) => `"${q}" isn't in the catalog yet — mention it in your message`} />
      </div>
      <div className="grid gap-2">
        <Label>Teacher</Label>
        <EntityPicker value={teacher} onChange={(v) => setTeacher(v && "create" in v ? null : v)} search={searchTeachers} placeholder="Teacher's name" createLabel={(q) => `"${q}" isn't in the catalog yet — mention them in your message`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label>Year</Label>
          <Select name="year" defaultValue={ANY}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={ANY}>Any</SelectItem>{YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Term</Label>
          <Select name="term" defaultValue={ANY}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={ANY}>Any</SelectItem>{["FALL", "SPRING", "SUMMER", "WINTER"].map((t) => <SelectItem key={t} value={t}>{t[0] + t.slice(1).toLowerCase()}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Type</Label>
          <Select name="kind" defaultValue={ANY}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={ANY}>Any</SelectItem>{["MIDTERM", "FINAL", "QUIZ", "PRACTICE", "OTHER"].map((k) => <SelectItem key={k} value={k}>{k[0] + k.slice(1).toLowerCase()}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required minLength={10} maxLength={2000} rows={4} defaultValue={state?.values?.message} placeholder="e.g. Taking Anderson's CS 101 this fall. Does anyone have her finals from 2019 or 2020?" />
      </div>
      <FormMessage error={state?.error} />
      <div><SubmitButton pendingText="Posting…">Post request</SubmitButton></div>
    </form>
  );
}
