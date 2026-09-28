import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { CatalogTables } from "./catalog-tables";

export const metadata = { title: "Catalog" };

export default async function AdminCatalogPage() {
  const admin = await requireAdmin();
  const [teachers, courses] = await Promise.all([
    db.teacher.findMany({ where: { schoolId: admin.schoolId }, orderBy: { normalizedName: "asc" }, include: { _count: { select: { exams: true } } } }),
    db.course.findMany({ where: { schoolId: admin.schoolId }, orderBy: { normalizedCode: "asc" }, include: { _count: { select: { exams: true } } } }),
  ]);
  return (
    <CatalogTables
      teachers={teachers.map((t) => ({ id: t.id, displayName: t.displayName, exams: t._count.exams }))}
      courses={courses.map((c) => ({ id: c.id, code: c.code, title: c.title, exams: c._count.exams }))}
    />
  );
}
