import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { NewRequestForm } from "./new-request-form";

export const metadata = { title: "New request" };

export default async function NewRequestPage({ searchParams }: PageProps<"/requests/new">) {
  const user = await requireUser();
  const { courseId, teacherId } = await searchParams;
  const [course, teacher] = await Promise.all([
    typeof courseId === "string" ? db.course.findFirst({ where: { id: courseId, schoolId: user.schoolId } }) : null,
    typeof teacherId === "string" ? db.teacher.findFirst({ where: { id: teacherId, schoolId: user.schoolId } }) : null,
  ]);
  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Request an exam</h1>
        <p className="text-muted-foreground">Everyone at {user.school.name} can see it and reply. You&apos;ll get an email when someone does.</p>
      </div>
      <NewRequestForm
        initialCourse={course ? { id: course.id, label: course.code } : null}
        initialTeacher={teacher ? { id: teacher.id, label: teacher.displayName } : null}
      />
    </div>
  );
}
