"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markAllRead } from "@/lib/notifications/actions";

export function MarkAllReadButton() {
  const [pending, start] = useTransition();
  return <Button variant="outline" size="sm" disabled={pending} onClick={() => start(() => markAllRead())}>Mark all read</Button>;
}
