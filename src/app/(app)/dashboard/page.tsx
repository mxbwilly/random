import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata = { title: "Home" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [examCount, teacherCount, openRequests] = await Promise.all([
    db.exam.count({ where: { schoolId: user.schoolId, status: "LIVE" } }),
    db.teacher.count({ where: { schoolId: user.schoolId } }),
    db.examRequest.count({ where: { schoolId: user.schoolId, status: "OPEN" } }),
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {user.displayName.split(" ")[0]}</h1>
        <p className="text-muted-foreground">{user.school.name}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Exams" value={examCount} href="/search" />
        <Stat label="Teachers" value={teacherCount} href="/search" />
        <Stat label="Open requests" value={openRequests} href="/requests" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Get started</CardTitle>
          <CardDescription>Browsing, uploading and requests arrive in the next build phases.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href="/search">Search teachers and courses</Link></Button>
          <Button asChild variant="outline"><Link href="/upload">Upload an exam</Link></Button>
          <Button asChild variant="outline"><Link href="/requests">Browse requests</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-3xl font-semibold">{value}</div>
    </Link>
  );
}
