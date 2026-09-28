"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth/session";
import { consumeCode, issueCode } from "@/lib/auth/codes";
import { schoolForEmail, emailDomain } from "@/lib/auth/school";
import { passwordResetEmail, sendEmail, verificationEmail } from "@/lib/email/send";
import { rateLimit } from "@/lib/rate-limit";

export type ActionState = { error?: string; success?: string; values?: Record<string, string> } | undefined;

/** Echo submitted text fields back so the form keeps them after an error. */
function keep(formData: FormData, ...names: string[]) {
  const values: Record<string, string> = {};
  for (const n of names) values[n] = String(formData.get(n) ?? "");
  return values;
}

async function clientKey(scope: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return `${scope}:${ip}`;
}

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");
const passwordSchema = z.string().min(10, "Password must be at least 10 characters.").max(200);

// ---------- Sign up ----------

const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(2, "Enter your name.").max(60),
  major: z.string().trim().max(80).optional().or(z.literal("")),
  acceptTerms: z.literal("on", { message: "You must accept the Terms to continue." }),
});

export async function signup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!rateLimit(await clientKey("signup"), 10, 60 * 60 * 1000).ok) {
    return { error: "Too many sign-up attempts. Try again later." };
  }
  const values = keep(formData, "email", "displayName", "major");
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const { email, password, displayName, major } = parsed.data;

  const school = await schoolForEmail(email);
  if (!school) {
    return {
      error: `We don't recognize @${emailDomain(email)} as a school email yet. Ask us to add your school from the takedown/contact page.`,
      values,
    };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing?.emailVerifiedAt) return { error: "An account with this email already exists. Try logging in.", values };

  const passwordHash = await hashPassword(password);
  const role = env.adminEmails.includes(email) ? "ADMIN" : "STUDENT";
  const user = existing
    ? await db.user.update({
        where: { id: existing.id },
        data: { passwordHash, displayName, major: major || null, role, acceptedTermsAt: new Date() },
      })
    : await db.user.create({
        data: { email, passwordHash, displayName, major: major || null, role, schoolId: school.id, acceptedTermsAt: new Date() },
      });

  const code = await issueCode(user.id, "SIGNUP");
  if (code) await sendEmail({ to: email, ...verificationEmail(code) });
  await createSession(user.id);
  redirect("/verify");
}

// ---------- Verify email ----------

const codeSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.") });

export async function verifyEmail(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.emailVerifiedAt) redirect("/");

  const parsed = codeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const result = await consumeCode(user.id, "SIGNUP", parsed.data.code);
  if (result === "invalid") return { error: "That code isn't right. Check the email and try again." };
  if (result === "expired") return { error: "That code has expired. Request a new one below." };
  if (result === "too_many_attempts") return { error: "Too many attempts. Request a new code below." };

  await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  redirect("/");
}

export async function resendVerification(): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.emailVerifiedAt) redirect("/");
  const code = await issueCode(user.id, "SIGNUP");
  if (!code) return { error: "A code was sent less than a minute ago. Check your inbox and spam folder." };
  await sendEmail({ to: user.email, ...verificationEmail(code) });
  return { success: `A new code was sent to ${user.email}.` };
}

// ---------- Log in / out ----------

const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password.") });

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = keep(formData, "email");
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const { email, password } = parsed.data;

  if (!rateLimit(await clientKey(`login:${email}`), 10, 15 * 60 * 1000).ok) {
    return { error: "Too many login attempts. Try again in 15 minutes.", values };
  }

  const user = await db.user.findUnique({ where: { email } });
  const ok = user ? await verifyPassword(user.passwordHash, password) : false;
  if (!user || !ok) return { error: "Incorrect email or password.", values };

  if (env.adminEmails.includes(email) && user.role !== "ADMIN") {
    await db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  }
  await createSession(user.id);
  redirect(user.emailVerifiedAt ? "/" : "/verify");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

// ---------- Password reset ----------

export async function forgotPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message, values: keep(formData, "email") };
  const email = parsed.data;
  if (!rateLimit(await clientKey("forgot"), 5, 15 * 60 * 1000).ok) {
    return { error: "Too many requests. Try again later." };
  }
  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    const code = await issueCode(user.id, "RESET");
    if (code) await sendEmail({ to: email, ...passwordResetEmail(code) });
  }
  // Same response whether or not the account exists.
  redirect(`/reset-password?email=${encodeURIComponent(email)}`);
}

const resetSchema = z.object({
  email: emailSchema,
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
  password: passwordSchema,
});

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = keep(formData, "email");
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const { email, code, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { error: "That code isn't valid.", values };
  const result = await consumeCode(user.id, "RESET", code);
  if (result !== "ok") return { error: result === "expired" ? "That code has expired. Request a new one." : "That code isn't valid.", values };

  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password), emailVerifiedAt: user.emailVerifiedAt ?? new Date() } }),
    db.session.deleteMany({ where: { userId: user.id } }), // log out everywhere
  ]);
  await createSession(user.id);
  redirect("/");
}
