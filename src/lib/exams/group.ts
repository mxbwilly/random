import type { Term } from "@/generated/prisma/enums";

const TERM_ORDER: Record<Term, number> = { WINTER: 0, SPRING: 1, SUMMER: 2, FALL: 3 };

/** Sorts newest term first: 2023 Fall, 2023 Spring, 2022 Fall ... */
export function sortByTermDesc<T extends { year: number; term: Term }>(rows: T[]) {
  return [...rows].sort((a, b) => b.year - a.year || TERM_ORDER[b.term] - TERM_ORDER[a.term]);
}

export type Group<T> = { id: string; name: string; sub?: string; exams: T[] };

/** Groups exams by a key (course or teacher); groups sorted by name, exams by term. */
export function groupExams<T extends { year: number; term: Term }>(
  rows: T[],
  key: (row: T) => string,
  label: (row: T) => { id: string; name: string; sub?: string },
): Group<T>[] {
  const map = new Map<string, Group<T>>();
  for (const row of rows) {
    const k = key(row);
    if (!map.has(k)) map.set(k, { ...label(row), exams: [] });
    map.get(k)!.exams.push(row);
  }
  return [...map.values()]
    .map((g) => ({ ...g, exams: sortByTermDesc(g.exams) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
