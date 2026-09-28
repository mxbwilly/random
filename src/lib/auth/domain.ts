export function emailDomain(email: string) {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

/**
 * "cs.demo.edu" -> ["cs.demo.edu", "demo.edu"] so a school registered as
 * "demo.edu" also accepts departmental subdomains. The bare TLD is excluded.
 */
export function domainCandidates(domain: string) {
  const parts = domain.split(".").filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < parts.length - 1; i++) out.push(parts.slice(i).join("."));
  return out;
}
