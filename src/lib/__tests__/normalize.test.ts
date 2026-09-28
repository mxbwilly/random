import { describe, expect, it } from "vitest";
import { normalizeCourseCode, normalizeName, termLabel } from "@/lib/normalize";

describe("normalizeCourseCode", () => {
  it("collapses spacing, punctuation and case", () => {
    expect(normalizeCourseCode("CS 101")).toBe("cs101");
    expect(normalizeCourseCode("cs-101")).toBe("cs101");
    expect(normalizeCourseCode("  CS101 ")).toBe("cs101");
  });
});

describe("normalizeName", () => {
  it("strips titles and normalizes whitespace", () => {
    expect(normalizeName("Dr. Jane  Smith")).toBe("jane smith");
    expect(normalizeName("Professor Jane Smith")).toBe("jane smith");
    expect(normalizeName("jane smith")).toBe("jane smith");
  });
  it("keeps hyphens and apostrophes", () => {
    expect(normalizeName("Mary-Kate O'Neil")).toBe("mary-kate o'neil");
  });
});

describe("termLabel", () => {
  it("title-cases enum values", () => {
    expect(termLabel("FALL")).toBe("Fall");
  });
});
