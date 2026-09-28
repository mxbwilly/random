import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="prose prose-neutral dark:prose-invert mx-auto w-full max-w-3xl flex-1 px-4 py-10 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:my-3 [&_p]:leading-7 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
