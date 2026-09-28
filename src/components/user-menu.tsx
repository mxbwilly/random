"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { LogOut, Moon, Settings, Sun, Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/(auth)/actions";

export function UserMenu({ displayName, email, schoolName }: { displayName: string; email: string; schoolName: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
          <Avatar className="size-8"><AvatarFallback>{initials || "?"}</AvatarFallback></Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="truncate font-medium">{displayName}</div>
          <div className="truncate text-xs text-muted-foreground">{email}</div>
          <div className="truncate text-xs text-muted-foreground">{schoolName}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/notifications"><Bell />Notifications</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/settings"><Settings />Settings</Link></DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          {resolvedTheme === "dark" ? <Sun /> : <Moon />}
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()}><LogOut />Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
