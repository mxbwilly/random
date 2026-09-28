import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

type Mail = { to: string; subject: string; text: string; html?: string };

/**
 * In-memory copy of sent mail for browser tests. Only filled when DEV_MAILBOX=1;
 * never set that in a real deployment. Kept on globalThis because Next bundles
 * server actions and route handlers separately, so a module-level array would
 * be duplicated.
 */
const g = globalThis as unknown as { __devMailbox?: (Mail & { at: number })[] };
export const devMailbox: (Mail & { at: number })[] = (g.__devMailbox ??= []);
const useDevMailbox = process.env.DEV_MAILBOX === "1";

/**
 * Sends email through Resend when RESEND_API_KEY is set, otherwise prints it
 * to the server console so local development needs no email account.
 */
export async function sendEmail(mail: Mail) {
  if (useDevMailbox) {
    devMailbox.push({ ...mail, at: Date.now() });
    if (devMailbox.length > 200) devMailbox.shift();
  }
  if (!env.resendApiKey) {
    console.log(`\n[email] To: ${mail.to}\n[email] Subject: ${mail.subject}\n${mail.text}\n`);
    return { ok: true, dev: true } as const;
  }
  const resend = new Resend(env.resendApiKey);
  const { error } = await resend.emails.send({
    from: env.emailFrom,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html ?? `<pre style="font-family:sans-serif">${escapeHtml(mail.text)}</pre>`,
  });
  if (error) {
    console.error("[email] send failed", error);
    return { ok: false, dev: false } as const;
  }
  return { ok: true, dev: false } as const;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function verificationEmail(code: string) {
  return {
    subject: `${code} is your ${env.appName} verification code`,
    text: `Your ${env.appName} verification code is ${code}.\n\nIt expires in 10 minutes. If you didn't request this, you can ignore this email.`,
  };
}

export function passwordResetEmail(code: string) {
  return {
    subject: `${code} is your ${env.appName} password reset code`,
    text: `Use code ${code} to reset your ${env.appName} password.\n\nIt expires in 10 minutes. If you didn't request this, you can ignore this email.`,
  };
}
