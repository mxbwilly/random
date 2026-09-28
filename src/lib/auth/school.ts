import "server-only";
import { db } from "@/lib/db";

export { emailDomain, domainCandidates } from "./domain";
import { domainCandidates, emailDomain } from "./domain";

/** Finds the school whose allowed domains include the email's domain (or a parent domain). */
export async function schoolForEmail(email: string) {
  const candidates = domainCandidates(emailDomain(email));
  if (candidates.length === 0) return null;
  return db.school.findFirst({ where: { emailDomains: { hasSome: candidates } } });
}
