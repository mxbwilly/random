import Link from "next/link";
import { Search, User, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { searchCourses, searchTeachers } from "@/lib/catalog/search";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const user = await requireUser();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const [teachers, courses] = query
    ? await Promise.all([searchTeachers(user.schoolId, query, 20), searchCourses(user.schoolId, query, 20)])
    : [[], []];

  const popular = query
    ? null
    : await db.teacher.findMany({
        where: { schoolId: user.schoolId },
        orderBy: { exams: { _count: "desc" } },
        take: 12,
        include: { department: true, _count: { select: { exams: { where: { status: "LIVE" } } } } },
      });

  return (
    <div className="grid gap-8">
      <form action="/search" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={query} placeholder="Teacher name or course code, e.g. Anderson or CS 101" className="pl-9" autoFocus />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {query ? (
        <div className="grid gap-8 md:grid-cols-2">
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><User className="size-4" />Teachers</h2>
            {teachers.length === 0 ? (
              <Empty text="No teachers match." />
            ) : (
              <ul className="divide-y rounded-md border">
                {teachers.map((t) => (
                  <li key={t.id}>
                    <Link href={`/teachers/${t.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50">
                      <span>
                        <span className="font-medium">{t.displayName}</span>
                        {t.departmentCode && <span className="ml-2 text-xs text-muted-foreground">{t.departmentCode}</span>}
                      </span>
                      <span className="text-sm text-muted-foreground">{t.examCount} exam{t.examCount === 1 ? "" : "s"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><BookOpen className="size-4" />Courses</h2>
            {courses.length === 0 ? (
              <Empty text="No courses match." />
            ) : (
              <ul className="divide-y rounded-md border">
                {courses.map((c) => (
                  <li key={c.id}>
                    <Link href={`/courses/${c.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50">
                      <span>
                        <span className="font-medium">{c.code}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{c.title}</span>
                      </span>
                      <span className="text-sm text-muted-foreground">{c.examCount} exam{c.examCount === 1 ? "" : "s"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <p className="text-sm text-muted-foreground md:col-span-2">
            Can&apos;t find it? <Link href="/upload" className="underline">Upload an exam</Link> or <Link href="/requests/new" className="underline">post a request</Link>.
          </p>
        </div>
      ) : (
        <section>
          <h2 className="mb-3 font-semibold">Teachers with the most exams at {user.school.name}</h2>
          {popular && popular.length > 0 ? (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((t) => (
                <li key={t.id}>
                  <Link href={`/teachers/${t.id}`} className="flex items-center justify-between rounded-md border px-4 py-3 hover:bg-muted/50">
                    <span>
                      <span className="font-medium">{t.displayName}</span>
                      {t.department && <span className="ml-2 text-xs text-muted-foreground">{t.department.code}</span>}
                    </span>
                    <span className="text-sm text-muted-foreground">{t._count.exams}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="Nothing here yet. Be the first to upload an exam." />
          )}
        </section>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</p>;
}
