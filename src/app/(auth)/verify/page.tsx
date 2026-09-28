import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { VerifyForm } from "./verify-form";

export const metadata = { title: "Verify your email" };

export default async function VerifyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.emailVerifiedAt) redirect("/");
  return <VerifyForm email={user.email} />;
}
