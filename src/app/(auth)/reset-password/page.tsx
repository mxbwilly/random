import { ResetForm } from "./reset-form";

export const metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { email } = await searchParams;
  return <ResetForm email={typeof email === "string" ? email : ""} />;
}
