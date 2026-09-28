import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExamGroups } from "@/components/exams/exam-groups";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { groupExams } from "@/lib/exams/group";

export default async function TeacherPage({ params }: PageProps<"/teachers/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const teacher = await db.teacher.findFirst({
    where: { id, schoolId: user.schoolId },
    include: {
      department: true,
      exams: {
        where: { status: "LIVE" },
        include: { course: true, _count: { select: { files: true } } },
      },
    },
  });
  if (!teacher) notFound();

  const groups = groupExams(
    teacher.exams,
    (e) => e.courseId,
    (e) => ({ id: e.course.id, name: e.course.code, sub: e.course.title }),
  );
  const years = teacher.exams.map((e) => e.year);
  const span = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : null;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{teacher.displayName}</h1>
          <p className="text-muted-foreground">
            {teacher.department?.name ?? "Department unknown"}
            {" · "}{teacher.exams.length} exam{teacher.exams.length === 1 ? "" : "s"}
            {span && ` · ${span}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href={`/requests/new?teacherId=${teacher.id}`}>Request an exam</Link></Button>
          <Button asChild><Link href={`/upload?teacherId=${teacher.id}`}>Upload an exam</Link></Button>
        </div>
      </div>
      <ExamGroups groups={groups} hrefPrefix="/courses" />
    </div>
  );
}
