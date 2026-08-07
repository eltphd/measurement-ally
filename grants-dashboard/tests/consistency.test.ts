import { describe, expect, it } from "vitest";
import { diffPhases, type FieldEntry } from "../src/lib/consistency";
import { fixtureSnapshot } from "../src/lib/fixtures";

/**
 * Acceptance criterion from the build spec: given the FaithLink LOI and
 * Phase Two field logs, the checker surfaces at minimum — amount, program
 * name, persons served, ZIP codes, board count, and the missing MHFA
 * component.
 */
describe("cross-phase consistency checker — FaithLink fixture", () => {
  const snap = fixtureSnapshot();
  const entries: FieldEntry[] = snap.fieldLog
    .filter((r) => r.grantIds.includes("fixturefaithlink"))
    .map((r) => ({ field: r.fieldName, phase: r.phase, value: r.value }));
  const diffs = diffPhases(entries);
  const byField = (name: string) => diffs.find((d) => d.field === name);

  it("catches the amount change with a dollar delta", () => {
    const d = byField("Amount Requested")!;
    expect(d.kind).toBe("changed");
    expect(d.delta).toContain("50,000");
    expect(d.severity).toBe("medium");
  });

  it("catches the program name change", () => {
    expect(byField("Program Name")!.kind).toBe("changed");
  });

  it("catches persons served as high severity", () => {
    const d = byField("Total Persons Served")!;
    expect(d.kind).toBe("changed");
    expect(d.severity).toBe("high");
    expect(d.delta).toBe("−303");
  });

  it("catches ZIP code drift with removed/added detail", () => {
    const d = byField("Service ZIP Codes")!;
    expect(d.kind).toBe("changed");
    expect(d.severity).toBe("high");
    expect(d.delta).toMatch(/removed.*43203/);
    expect(d.delta).toMatch(/added.*43205/);
  });

  it("catches the board count change as high severity", () => {
    const d = byField("Board Member Count")!;
    expect(d.kind).toBe("changed");
    expect(d.severity).toBe("high");
    expect(d.delta).toBe("+5");
  });

  it("flags the MHFA component missing from the Full phase", () => {
    const d = byField("MHFA Component")!;
    expect(d.kind).toBe("missing");
    expect(d.severity).toBe("high");
  });

  it("does not flag unchanged fields", () => {
    expect(byField("Blueprint Goal")!.kind).toBe("same");
  });

  it("sorts high-severity findings first", () => {
    const material = diffs.filter((d) => d.kind !== "same");
    expect(material[0].severity).toBe("high");
  });
});

describe("value comparison details", () => {
  it("treats same figure with different phrasing as consistent", () => {
    const diffs = diffPhases([
      { field: "Total Persons Served", phase: "LOI", value: "500" },
      { field: "Total Persons Served", phase: "Full", value: "500 (197 therapy + 200 MHFA + 103 events)" },
    ]);
    expect(diffs[0].kind).toBe("same");
  });

  it("returns nothing with fewer than two phases", () => {
    expect(diffPhases([{ field: "A", phase: "LOI", value: "x" }])).toEqual([]);
  });

  it("marks fields that appear only in the later phase as added/info", () => {
    const diffs = diffPhases([
      { field: "Amount", phase: "LOI", value: "$1" },
      { field: "Amount", phase: "Full", value: "$1" },
      { field: "Indirect Costs", phase: "Full", value: "$0" },
    ]);
    const added = diffs.find((d) => d.field === "Indirect Costs")!;
    expect(added.kind).toBe("added");
    expect(added.severity).toBe("info");
  });
});
