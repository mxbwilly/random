"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { destroySession } from "@/lib/auth/session";
import type { ActionState } from "@/app/(auth)/actions";

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Enter your name.").max(60),
  major: z.string().trim().max(80),
  gradYear: z.string().trim().transform((v) => (v ? Number(v) : null)).pipe(z.number().int().min(1950).max(2100).nullable()),
});

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { displayName, major, gradYear } = parsed.data;
  await db.user.update({ where: { id: user.id }, data: { displayName, major: major || null, gradYear } });
  revalidatePath("/settings");
  return { success: "Saved." };
}

export async function deleteAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (String(formData.get("confirm")).trim().toLowerCase() !== "delete") return { error: 'Type "delete" to confirm.' };
  // Exams keep existing with uploaderId set to null (onDelete: SetNull); everything else cascades.
  await db.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/");
}
