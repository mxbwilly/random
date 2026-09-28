import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExamGroups } from "@/components/exams/exam-groups";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { groupExams } from "@/lib/exams/group";

export default async function CoursePage({ params }: PageProps<"/courses/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const course = await db.course.findFirst({
    where: { id, schoolId: user.schoolId },
    include: {
      department: true,
      exams: {
        where: { status: "LIVE" },
        include: { teacher: true, _count: { select: { files: true } } },
      },
    },
  });
  if (!course) notFound();

  const groups = groupExams(
    course.exams,
    (e) => e.teacherId,
    (e) => ({ id: e.teacher.id, name: e.teacher.displayName }),
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{course.code}</h1>
          <p className="text-muted-foreground">
            {course.title}
            {course.department && ` · ${course.department.name}`}
            {" · "}{course.exams.length} exam{course.exams.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href={`/requests/new?courseId=${course.id}`}>Request an exam</Link></Button>
          <Button asChild><Link href={`/upload?courseId=${course.id}`}>Upload an exam</Link></Button>
        </div>
      </div>
      <ExamGroups groups={groups} hrefPrefix="/teachers" />
    </div>
  );
}
