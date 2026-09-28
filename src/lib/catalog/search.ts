import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { normalizeCourseCode, normalizeName } from "@/lib/normalize";

export type TeacherHit = { id: string; displayName: string; departmentCode: string | null; examCount: number; score: number };
export type CourseHit = { id: string; code: string; title: string; examCount: number; score: number };

/** Fuzzy teacher search inside one school using pg_trgm similarity. */
export async function searchTeachers(schoolId: string, query: string, limit = 8): Promise<TeacherHit[]> {
  const q = normalizeName(query);
  if (!q) return [];
  return db.$queryRaw<TeacherHit[]>(Prisma.sql`
    SELECT t.id, t."displayName", d.code AS "departmentCode",
           (SELECT COUNT(*)::int FROM "Exam" e WHERE e."teacherId" = t.id AND e.status = 'LIVE') AS "examCount",
           GREATEST(similarity(t."normalizedName", ${q}), CASE WHEN t."normalizedName" LIKE ${"%" + q + "%"} THEN 0.6 ELSE 0 END) AS score
    FROM "Teacher" t LEFT JOIN "Department" d ON d.id = t."departmentId"
    WHERE t."schoolId" = ${schoolId}
      AND (t."normalizedName" % ${q} OR t."normalizedName" LIKE ${"%" + q + "%"})
    ORDER BY score DESC, "examCount" DESC
    LIMIT ${limit}`);
}

/** Fuzzy course search by code or title inside one school. */
export async function searchCourses(schoolId: string, query: string, limit = 8): Promise<CourseHit[]> {
  const raw = query.trim().toLowerCase();
  const code = normalizeCourseCode(query);
  if (!raw) return [];
  return db.$queryRaw<CourseHit[]>(Prisma.sql`
    SELECT c.id, c.code, c.title,
           (SELECT COUNT(*)::int FROM "Exam" e WHERE e."courseId" = c.id AND e.status = 'LIVE') AS "examCount",
           GREATEST(
             CASE WHEN c."normalizedCode" = ${code} THEN 1.0 ELSE 0 END,
             CASE WHEN ${code} <> '' AND c."normalizedCode" LIKE ${code + "%"} THEN 0.8 ELSE 0 END,
             similarity(c."normalizedCode", ${code}),
             similarity(lower(c.title), ${raw}),
             CASE WHEN lower(c.title) LIKE ${"%" + raw + "%"} THEN 0.5 ELSE 0 END
           ) AS score
    FROM "Course" c
    WHERE c."schoolId" = ${schoolId}
      AND (c."normalizedCode" LIKE ${code + "%"} OR c."normalizedCode" % ${code} OR lower(c.title) % ${raw} OR lower(c.title) LIKE ${"%" + raw + "%"})
    ORDER BY score DESC, "examCount" DESC
    LIMIT ${limit}`);
}

/** Exact-or-create for a course; returns the row and whether it was created. */
export async function findOrCreateCourse(schoolId: string, userId: string, code: string, title: string) {
  const normalizedCode = normalizeCourseCode(code);
  const existing = await db.course.findUnique({ where: { schoolId_normalizedCode: { schoolId, normalizedCode } } });
  if (existing) return { course: existing, created: false };
  const course = await db.course.create({
    data: { schoolId, code: code.trim().replace(/\s+/g, " ").toUpperCase(), normalizedCode, title: title.trim(), createdById: userId },
  });
  return { course, created: true };
}

export async function findOrCreateTeacher(schoolId: string, userId: string, displayName: string) {
  const normalizedName = normalizeName(displayName);
  const existing = await db.teacher.findFirst({ where: { schoolId, normalizedName } });
  if (existing) return { teacher: existing, created: false };
  const teacher = await db.teacher.create({
    data: { schoolId, displayName: displayName.trim().replace(/\s+/g, " "), normalizedName, createdById: userId },
  });
  return { teacher, created: true };
}
