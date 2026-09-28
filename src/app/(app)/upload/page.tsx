import { UploadForm } from "@/components/upload/upload-form";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const metadata = { title: "Upload an exam" };

export default async function UploadPage({ searchParams }: PageProps<"/upload">) {
  const user = await requireUser();
  const { courseId, teacherId } = await searchParams;

  const [course, teacher] = await Promise.all([
    typeof courseId === "string" ? db.course.findFirst({ where: { id: courseId, schoolId: user.schoolId } }) : null,
    typeof teacherId === "string" ? db.teacher.findFirst({ where: { id: teacherId, schoolId: user.schoolId } }) : null,
  ]);

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Upload an exam</h1>
        <p className="text-muted-foreground">Takes about a minute. It becomes visible to verified students at {user.school.name} right away.</p>
      </div>
      <UploadForm
        initialCourse={course ? { id: course.id, label: course.code } : null}
        initialTeacher={teacher ? { id: teacher.id, label: teacher.displayName } : null}
        maxMb={Math.round(env.maxUploadBytes / 1024 / 1024)}
      />
    </div>
  );
}
