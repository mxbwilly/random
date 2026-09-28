import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RootNotFound() {
  return (
    <div className="mx-auto grid max-w-md gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">Check the address, or start from the home page.</p>
      <div className="flex justify-center"><Button asChild><Link href="/">Home</Link></Button></div>
    </div>
  );
}
