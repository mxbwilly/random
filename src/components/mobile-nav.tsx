"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileNav({ links, appName }: { links: { href: string; label: string }[]; appName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu"><Menu /></Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader><SheetTitle>{appName}</SheetTitle></SheetHeader>
        <nav className="grid gap-1 px-4">
          {links.map((l) => (
            <Button key={l.href} asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
              <Link href={l.href}>{l.label}</Link>
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
