import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { normalizeCourseCode, normalizeName } from "../src/lib/normalize";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const school = await db.school.upsert({
    where: { slug: "demo-university" },
    update: {},
    create: { name: "Demo University", slug: "demo-university", emailDomains: ["demo.edu"] },
  });

  const departments = await Promise.all(
    [
      ["CS", "Computer Science"],
      ["MATH", "Mathematics"],
      ["PHYS", "Physics"],
      ["ECON", "Economics"],
    ].map(([code, name]) =>
      db.department.upsert({
        where: { schoolId_code: { schoolId: school.id, code } },
        update: {},
        create: { schoolId: school.id, code, name },
      }),
    ),
  );
  const dept = Object.fromEntries(departments.map((d) => [d.code, d]));

  const password = await hashPassword("password1234");
  const admin = await db.user.upsert({
    where: { email: "admin@demo.edu" },
    update: { passwordHash: password },
    create: {
      email: "admin@demo.edu",
      passwordHash: password,
      displayName: "Demo Admin",
      role: "ADMIN",
      schoolId: school.id,
      emailVerifiedAt: new Date(),
      acceptedTermsAt: new Date(),
    },
  });
  const student = await db.user.upsert({
    where: { email: "student@demo.edu" },
    update: { passwordHash: password },
    create: {
      email: "student@demo.edu",
      passwordHash: password,
      displayName: "Sam Student",
      major: "Computer Science",
      gradYear: 2027,
      schoolId: school.id,
      emailVerifiedAt: new Date(),
      acceptedTermsAt: new Date(),
    },
  });

  const courseDefs = [
    ["CS 101", "Introduction to Programming", "CS"],
    ["CS 240", "Data Structures", "CS"],
    ["MATH 151", "Calculus I", "MATH"],
    ["PHYS 201", "Mechanics", "PHYS"],
    ["ECON 101", "Principles of Microeconomics", "ECON"],
  ] as const;
  const courses = Object.fromEntries(
    await Promise.all(
      courseDefs.map(async ([code, title, d]) => [
        code,
        await db.course.upsert({
          where: { schoolId_normalizedCode: { schoolId: school.id, normalizedCode: normalizeCourseCode(code) } },
          update: {},
          create: { schoolId: school.id, code, normalizedCode: normalizeCourseCode(code), title, departmentId: dept[d].id, createdById: admin.id },
        }),
      ]),
    ),
  );

  const teacherDefs = [
    ["Alice Anderson", "CS"],
    ["Bob Brown", "CS"],
    ["Carol Chen", "MATH"],
    ["David Diaz", "PHYS"],
  ] as const;
  const teachers: Record<string, { id: string }> = {};
  for (const [name, d] of teacherDefs) {
    const normalizedName = normalizeName(name);
    const existing = await db.teacher.findFirst({ where: { schoolId: school.id, normalizedName } });
    teachers[name] =
      existing ??
      (await db.teacher.create({
        data: { schoolId: school.id, displayName: name, normalizedName, departmentId: dept[d].id, createdById: admin.id },
      }));
  }

  // Sample exam metadata (no files) so browsing pages have something to show.
  const examCount = await db.exam.count({ where: { schoolId: school.id } });
  if (examCount === 0) {
    const rows = [
      ["CS 101", "Alice Anderson", 2019, "FALL", "MIDTERM"],
      ["CS 101", "Alice Anderson", 2019, "FALL", "FINAL"],
      ["CS 101", "Alice Anderson", 2020, "SPRING", "FINAL"],
      ["CS 101", "Bob Brown", 2023, "FALL", "FINAL"],
      ["CS 240", "Alice Anderson", 2021, "FALL", "MIDTERM"],
      ["CS 240", "Alice Anderson", 2021, "FALL", "FINAL"],
      ["MATH 151", "Carol Chen", 2022, "SPRING", "FINAL"],
      ["PHYS 201", "David Diaz", 2020, "FALL", "MIDTERM"],
    ] as const;
    for (const [course, teacher, year, term, kind] of rows) {
      await db.exam.create({
        data: {
          schoolId: school.id,
          courseId: courses[course].id,
          teacherId: teachers[teacher].id,
          uploaderId: student.id,
          year,
          term,
          kind,
          attestedAt: new Date(),
        },
      });
    }
  }

  console.log(`Seeded ${school.name}. Log in as student@demo.edu or admin@demo.edu with password "password1234".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
