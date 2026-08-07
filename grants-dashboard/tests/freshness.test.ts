import { describe, expect, it } from "vitest";
import { deadlineTone } from "../src/lib/dates";
import { docHealth } from "../src/lib/freshness";
import type { DocRow, OrgFacts } from "../src/lib/types";

const TODAY = "2026-08-07";

const baseDoc: DocRow = {
  id: "d1", org: "namifc", orgPageIds: [], name: "Doc", type: "Other",
  fileLink: "", issueDate: null, coversStart: null, coversEnd: null,
  expires: null, superseded: false, notes: "",
};

const namiFacts = { fyEnd: "2025-06-30" } as OrgFacts;

describe("document freshness", () => {
  it("marks a 2020 Good Standing certificate stale (90-day window)", () => {
    const h = docHealth({ ...baseDoc, type: "Good Standing", issueDate: "2020-01-01" }, undefined, TODAY);
    expect(h.status).toBe("stale");
    expect(h.reason).toContain("90");
  });

  it("marks a fresh Good Standing certificate current", () => {
    const h = docHealth({ ...baseDoc, type: "Good Standing", issueDate: "2026-07-15" }, undefined, TODAY);
    expect(h.status).toBe("current");
  });

  it("marks an expired document stale", () => {
    const h = docHealth({ ...baseDoc, expires: "2026-08-01" }, undefined, TODAY);
    expect(h.status).toBe("stale");
  });

  it("marks a document expiring within 30 days", () => {
    const h = docHealth({ ...baseDoc, expires: "2026-08-27" }, undefined, TODAY);
    expect(h.status).toBe("expiring");
  });

  it("warns when a 990 does not cover the org's stated fiscal year", () => {
    const h = docHealth(
      { ...baseDoc, type: "990", coversStart: "2022-07-01", coversEnd: "2023-06-30" },
      namiFacts,
      TODAY,
    );
    expect(h.warning).toMatch(/does not cover/i);
  });

  it("does not warn when a 990 covers the fiscal year", () => {
    const h = docHealth(
      { ...baseDoc, type: "990", coversStart: "2024-07-01", coversEnd: "2025-06-30" },
      namiFacts,
      TODAY,
    );
    expect(h.warning).toBeNull();
    expect(h.status).toBe("current");
  });

  it("treats superseded docs as superseded regardless of dates", () => {
    const h = docHealth({ ...baseDoc, superseded: true, expires: "2030-01-01" }, undefined, TODAY);
    expect(h.status).toBe("superseded");
  });

  it("asks for dates instead of guessing when none exist", () => {
    const h = docHealth(baseDoc, undefined, TODAY);
    expect(h.status).toBe("unknown");
  });
});

describe("deadline coloring", () => {
  it("renders red under 7 days without manual tagging", () => {
    expect(deadlineTone(5)).toBe("red");
    expect(deadlineTone(0)).toBe("red");
    expect(deadlineTone(7)).toBe("red");
  });
  it("renders amber for 8–14 days", () => {
    expect(deadlineTone(8)).toBe("amber");
    expect(deadlineTone(14)).toBe("amber");
  });
  it("is neutral beyond 14 days", () => {
    expect(deadlineTone(15)).toBe("ok");
  });
  it("flags past dates", () => {
    expect(deadlineTone(-1)).toBe("past");
  });
});
