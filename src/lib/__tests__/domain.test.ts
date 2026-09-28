import { describe, expect, it } from "vitest";
import { domainCandidates, emailDomain } from "@/lib/auth/domain";

describe("emailDomain", () => {
  it("lowercases and trims", () => {
    expect(emailDomain("  Sam@Demo.EDU ")).toBe("demo.edu");
    expect(emailDomain("nope")).toBe("");
  });
});

describe("domainCandidates", () => {
  it("includes parent domains but never the bare TLD", () => {
    expect(domainCandidates("cs.demo.edu")).toEqual(["cs.demo.edu", "demo.edu"]);
    expect(domainCandidates("demo.edu")).toEqual(["demo.edu"]);
    expect(domainCandidates("")).toEqual([]);
  });
});
