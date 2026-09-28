"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/form-message";
import { EntityPicker, type PickerValue } from "./entity-picker";
import { searchCoursesAction, searchTeachersAction } from "@/lib/catalog/actions";
import { createExamDraft, finalizeExam } from "@/lib/exams/actions";
import { ACCEPT_ATTR, CURRENT_YEAR, MAX_EXAM_FILES, MAX_SOLUTION_FILES, MIN_YEAR } from "@/lib/exams/files";
import { uploadFile } from "./upload-client";

const TERMS = ["FALL", "SPRING", "SUMMER", "WINTER"] as const;
const KINDS = ["MIDTERM", "FINAL", "QUIZ", "PRACTICE", "OTHER"] as const;
const YEARS = Array.from({ length: CURRENT_YEAR - MIN_YEAR + 1 }, (_, i) => CURRENT_YEAR - i);

export function UploadForm({
  initialCourse,
  initialTeacher,
  maxMb,
  requestId,
}: {
  initialCourse: { id: string; label: string } | null;
  initialTeacher: { id: string; label: string } | null;
  maxMb: number;
  requestId: string | null;
}) {
  const router = useRouter();
  const [course, setCourse] = useState<PickerValue>(initialCourse);
  const [courseTitle, setCourseTitle] = useState("");
  const [teacher, setTeacher] = useState<PickerValue>(initialTeacher);
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [term, setTerm] = useState<string>("FALL");
  const [kind, setKind] = useState<string>("FINAL");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [examFiles, setExamFiles] = useState<File[]>([]);
  const [solutionFiles, setSolutionFiles] = useState<File[]>([]);
  const [anonymous, setAnonymous] = useState(true);
  const [attested, setAttested] = useState(false);
  const [error, setError] = useState<string>();
  const [progress, setProgress] = useState<string | null>(null);

  const searchCourses = useCallback(
    async (q: string) => (await searchCoursesAction(q)).map((c) => ({ id: c.id, label: c.code, sub: c.title, count: c.examCount })),
    [],
  );
  const searchTeachers = useCallback(
    async (q: string) => (await searchTeachersAction(q)).map((t) => ({ id: t.id, label: t.displayName, sub: t.departmentCode ?? undefined, count: t.examCount })),
    [],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!course) return setError("Pick or add the course.");
    if ("create" in course && courseTitle.trim().length < 2) return setError("Add the course title for the new course.");
    if (!teacher) return setError("Pick or add the teacher.");
    if (examFiles.length === 0) return setError("Attach at least one exam file.");
    if (!attested) return setError("Please confirm the sharing statement.");

    const files = [
      ...examFiles.map((f) => ({ file: f, kind: "EXAM" as const })),
      ...solutionFiles.map((f) => ({ file: f, kind: "SOLUTIONS" as const })),
    ];

    setProgress("Creating exam…");
    const draft = await createExamDraft({
      course: "create" in course ? { code: course.create, title: courseTitle } : { id: course.id },
      teacher: "create" in teacher ? { name: teacher.create } : { id: teacher.id },
      year: Number(year),
      term: term as (typeof TERMS)[number],
      kind: kind as (typeof KINDS)[number],
      title,
      notes,
      anonymous,
      attested: true,
      files: files.map(({ file, kind }) => ({ name: file.name, type: file.type, size: file.size, kind })),
    });
    if (!draft.ok) {
      setProgress(null);
      return setError(draft.error);
    }

    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(`Uploading ${i + 1} of ${files.length}: ${files[i].file.name}`);
        await uploadFile(draft.uploads[i].target, files[i].file);
      }
    } catch (err) {
      setProgress(null);
      return setError(err instanceof Error ? err.message : "Upload failed.");
    }

    setProgress("Publishing…");
    const done = await finalizeExam(draft.examId, requestId ?? undefined);
    setProgress(null);
    if (!done.ok) return setError(done.error);
    toast.success("Exam uploaded. Thank you!");
    router.push(`/exams/${draft.examId}`);
  }

  const busy = progress !== null;

  return (
    <form onSubmit={submit} className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Course and teacher</CardTitle>
          <CardDescription>Search your school&apos;s catalog first so exams stay grouped together. Add a new entry only if it&apos;s truly missing.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Course</Label>
            <EntityPicker value={course} onChange={setCourse} search={searchCourses} placeholder="Course code, e.g. CS 101" createLabel={(q) => `Add new course "${q.toUpperCase()}"`} />
            {course && "create" in course && (
              <Input value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} placeholder="Course title, e.g. Introduction to Programming" required />
            )}
          </div>
          <div className="grid gap-2">
            <Label>Teacher</Label>
            <EntityPicker value={teacher} onChange={setTeacher} search={searchTeachers} placeholder="Teacher's name" createLabel={(q) => `Add new teacher "${q}"`} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. When and what</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label>Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Term</Label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TERMS.map((t) => <SelectItem key={t} value={t}>{t[0] + t.slice(1).toLowerCase()}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Type</Label>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k}>{k[0] + k.slice(1).toLowerCase()}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:col-span-3">
            <Label htmlFor="title">Title <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="e.g. Midterm 2, Section B" />
          </div>
          <div className="grid gap-2 sm:col-span-3">
            <Label htmlFor="notes">Notes <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} placeholder="Anything useful: open book? how similar was it to the following year?" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Files</CardTitle>
          <CardDescription>PDF or images, up to {maxMb} MB each. Photos of a paper exam are fine.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="examFiles">Exam (up to {MAX_EXAM_FILES} files)</Label>
            <Input id="examFiles" type="file" accept={ACCEPT_ATTR} multiple onChange={(e) => setExamFiles(Array.from(e.target.files ?? []).slice(0, MAX_EXAM_FILES))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="solutionFiles">Solutions / answer key <span className="text-muted-foreground">(optional, up to {MAX_SOLUTION_FILES})</span></Label>
            <Input id="solutionFiles" type="file" accept={ACCEPT_ATTR} multiple onChange={(e) => setSolutionFiles(Array.from(e.target.files ?? []).slice(0, MAX_SOLUTION_FILES))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Confirm</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={anonymous} onCheckedChange={(v) => setAnonymous(v === true)} className="mt-0.5" />
            <span>Post anonymously. Other students see &quot;a student&quot;; site admins can still see it was you.</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={attested} onCheckedChange={(v) => setAttested(v === true)} className="mt-0.5" />
            <span>
              I confirm this is a past exam, not a current or upcoming one, and that sharing it doesn&apos;t violate an honor code, course policy or agreement I accepted.
            </span>
          </label>
          <FormMessage error={error} />
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Upload />}
              {busy ? "Working…" : "Upload exam"}
            </Button>
            {progress && <span className="text-sm text-muted-foreground">{progress}</span>}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
