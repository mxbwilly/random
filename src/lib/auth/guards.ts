import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./session";

/** Redirects to /login (or /verify) unless a verified user is signed in. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.emailVerifiedAt) redirect("/verify");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
