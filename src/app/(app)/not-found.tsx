import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-md gap-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Not here</h1>
      <p className="text-muted-foreground">This page doesn&apos;t exist, was removed, or belongs to another school.</p>
      <div className="flex justify-center gap-2">
        <Button asChild><Link href="/dashboard">Go home</Link></Button>
        <Button asChild variant="outline"><Link href="/search">Search</Link></Button>
      </div>
    </div>
  );
}
