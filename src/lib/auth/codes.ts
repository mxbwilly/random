import "server-only";
import { createHash, randomInt } from "node:crypto";
import { db } from "@/lib/db";
import type { CodePurpose } from "@/generated/prisma/enums";

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Issues a fresh 6-digit code, invalidating earlier ones for the same purpose.
 * Returns null when a code was issued less than a minute ago (cooldown).
 */
export async function issueCode(userId: string, purpose: CodePurpose) {
  const recent = await db.verificationCode.findFirst({
    where: { userId, purpose, usedAt: null, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
  });
  if (recent) return null;

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await db.$transaction([
    db.verificationCode.updateMany({
      where: { userId, purpose, usedAt: null },
      data: { usedAt: new Date() },
    }),
    db.verificationCode.create({
      data: { userId, purpose, codeHash: hashCode(code), expiresAt: new Date(Date.now() + CODE_TTL_MS) },
    }),
  ]);
  return code;
}

export type CodeCheck = "ok" | "invalid" | "expired" | "too_many_attempts";

export async function consumeCode(userId: string, purpose: CodePurpose, code: string): Promise<CodeCheck> {
  const record = await db.verificationCode.findFirst({
    where: { userId, purpose, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return "invalid";
  if (record.expiresAt.getTime() < Date.now()) return "expired";
  if (record.attempts >= MAX_ATTEMPTS) return "too_many_attempts";

  if (record.codeHash !== hashCode(code.trim())) {
    await db.verificationCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return record.attempts + 1 >= MAX_ATTEMPTS ? "too_many_attempts" : "invalid";
  }
  await db.verificationCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return "ok";
}
