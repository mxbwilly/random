import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, MessageSquare, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(user.emailVerifiedAt ? "/dashboard" : "/verify");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4">
        <section className="py-20 text-center md:py-28">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Study from the exams your teacher actually gave.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {env.appName} is a student-run archive of past exams, organized by teacher, course and term.
            Find what your professor asked in 2020, and share what they asked you.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg"><Link href="/signup">Sign up with your school email</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/login">Log in</Link></Button>
          </div>
        </section>
        <section className="grid gap-6 pb-20 md:grid-cols-2 lg:grid-cols-4">
          <Feature icon={<BookOpen />} title="Browse by teacher" text="Every exam a teacher has given, grouped by course, year and term. Teachers reuse structure; you get to see it." />
          <Feature icon={<Upload />} title="Upload in a minute" text="Pick the course and teacher, add the year and term, drop in a PDF or photos. You stay anonymous by default." />
          <Feature icon={<MessageSquare />} title="Ask your school" text="Post a request for the exam you need. Students in your classes can reply or upload it directly." />
          <Feature icon={<ShieldCheck />} title="School-only access" text="Only verified students from your school can see your school's exams. Nothing is public or indexed." />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-lg border p-6">
      <div className="mb-3 inline-flex rounded-md bg-muted p-2 [&_svg]:size-5">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
