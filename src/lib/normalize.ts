/** "CS  101" / "cs-101" / "CS101" -> "cs101" so duplicates collide. */
export function normalizeCourseCode(code: string) {
  return code.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** "Dr. Jane  Smith" / "jane smith" -> "jane smith". */
export function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/\b(dr|prof|professor|mr|mrs|ms|mx)\.?\s+/g, "")
    .replace(/[^a-z\s'-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function termLabel(term: string) {
  return term.charAt(0) + term.slice(1).toLowerCase();
}

export function kindLabel(kind: string) {
  return kind.charAt(0) + kind.slice(1).toLowerCase();
}
