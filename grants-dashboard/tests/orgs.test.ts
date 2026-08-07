import { describe, expect, it } from "vitest";
import { fixtureSnapshot } from "../src/lib/fixtures";
import { buildOrgDefs, inferOrg, resolveScope } from "../src/lib/orgs";

const defs = buildOrgDefs(fixtureSnapshot().orgFacts);

describe("dynamic org definitions from the Org Facts Registry", () => {
  it("builds one def per registry row", () => {
    expect(defs.map((d) => d.key).sort()).toEqual(["arkbuilders", "namifc", "rawsunart", "ussq"]);
  });

  it("new clients resolve from their registry row alone", () => {
    expect(resolveScope("lacey@rawsunart.com", defs)).toBe("rawsunart");
    expect(inferOrg("lacey@rawsunart.com", "", defs)).toBe("rawsunart");
  });

  it("admins see everything", () => {
    expect(resolveScope("erica@measurementally.com", defs)).toBe("all");
    expect(resolveScope("ERICA@measurementally.com", defs)).toBe("all");
  });

  it("viewer emails from the registry are pinned to their org", () => {
    expect(resolveScope("rachelle@namifc.org", defs)).toBe("namifc");
    expect(resolveScope("laurita.barber@namifc.org", defs)).toBe("namifc");
    expect(resolveScope("george@arkbuilders.org", defs)).toBe("arkbuilders");
  });

  it("unknown emails get nothing", () => {
    expect(resolveScope("stranger@example.com", defs)).toBeNull();
    expect(resolveScope("", defs)).toBeNull();
  });
});

describe("grant → org inference", () => {
  it("matches by grantee email domain first", () => {
    expect(inferOrg("george@arkbuilders.org", "Some Title", defs)).toBe("arkbuilders");
  });

  it("falls back to name match on the grantee organization title", () => {
    expect(inferOrg("", "NAMI Franklin County — SOS 4.0 (RFA #109)", defs)).toBe("namifc");
    expect(inferOrg("", "US-Squared Research Institute pilot", defs)).toBe("ussq");
  });

  it("leaves unmatched grants admin-only", () => {
    expect(inferOrg("erica@measurementally.com", "Measurement Ally", defs)).toBeNull();
    expect(inferOrg("dajuan@ucl.org", "Unity Changes Lives", defs)).toBeNull();
  });
});
