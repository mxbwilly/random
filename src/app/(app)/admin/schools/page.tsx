import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { NewSchoolForm, SchoolRow } from "./school-forms";

export const metadata = { title: "Schools" };

export default async function AdminSchoolsPage() {
  await requireAdmin();
  const schools = await db.school.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { users: true, exams: true } } } });
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="grid gap-3">
        <h2 className="font-semibold">Schools ({schools.length})</h2>
        <ul className="grid gap-3">
          {schools.map((s) => (
            <SchoolRow key={s.id} school={{ id: s.id, name: s.name, slug: s.slug, emailDomains: s.emailDomains, users: s._count.users, exams: s._count.exams }} />
          ))}
        </ul>
      </div>
      <NewSchoolForm />
    </div>
  );
}
