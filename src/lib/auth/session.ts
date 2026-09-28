import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export { SESSION_COOKIE } from "./session-cookie";
import { SESSION_COOKIE } from "./session-cookie";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const RENEW_AFTER_MS = 15 * 24 * 60 * 60 * 1000; // extend when half elapsed

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const h = await headers();
  await db.session.create({
    data: {
      id: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      userAgent: h.get("user-agent")?.slice(0, 255) ?? null,
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    },
  });
  await setSessionCookie(token, new Date(Date.now() + SESSION_TTL_MS));
}

async function setSessionCookie(token: string, expires: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { id: hashToken(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof loadSessionUser>>>;

async function loadSessionUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          major: true,
          gradYear: true,
          role: true,
          schoolId: true,
          emailVerifiedAt: true,
          school: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  // Sliding expiry: extend the session once it is more than half used.
  if (session.expiresAt.getTime() - Date.now() < SESSION_TTL_MS - RENEW_AFTER_MS) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await db.session.update({ where: { id: session.id }, data: { expiresAt } });
    try {
      await setSessionCookie(token, expiresAt);
    } catch {
      // Cookies can't be set during a render; the next mutation will renew it.
    }
  }
  return session.user;
}

/** Cached per request. Returns null when logged out. */
export const getCurrentUser = cache(loadSessionUser);
