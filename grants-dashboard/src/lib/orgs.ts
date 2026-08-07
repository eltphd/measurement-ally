import { adminEmails, allowlistOverrides, type Scope } from "./config";
import type { OrgFacts } from "./types";

/**
 * Client orgs are rows in the Notion Org Facts Registry. Erica onboards a
 * client by adding a row with an Org Key, the org's Email Domains, and the
 * Viewer Emails allowed to sign in — no code change, no deploy.
 */
export interface OrgDef {
  key: string;
  name: string;
  emailDomains: string[];
  nameMatch: string[];
  viewerEmails: string[];
}

const splitList = (s: string): string[] =>
  s.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 32);
}

/** The key a facts row answers to: its explicit Org Key, else a name slug. */
export function orgKeyForFacts(f: Pick<OrgFacts, "orgKey" | "orgName">): string {
  return (f.orgKey ?? "").trim().toLowerCase() || slugify(f.orgName);
}

export function buildOrgDefs(orgFacts: OrgFacts[]): OrgDef[] {
  const defs: OrgDef[] = [];
  for (const f of orgFacts) {
    const key = orgKeyForFacts(f);
    if (!key || defs.some((d) => d.key === key)) continue;
    defs.push({
      key,
      name: f.orgName || f.legalName || key,
      emailDomains: splitList(f.emailDomains),
      nameMatch: splitList(f.nameMatch),
      viewerEmails: splitList(f.viewerEmails),
    });
  }
  return defs;
}

/** Who may sign in, and what they see. Null = not allowed at all. */
export function resolveScope(email: string, defs: OrgDef[]): Scope | null {
  const em = email.trim().toLowerCase();
  if (!em) return null;
  if (adminEmails().includes(em)) return "all";
  const override = allowlistOverrides()[em];
  if (override) return override;
  for (const d of defs) {
    if (d.viewerEmails.includes(em)) return d.key;
  }
  return null;
}

/**
 * Map a tracker grant to a client org: Grantee Email domain wins, then a
 * Name Match against the Grantee Organization title. No match = visible to
 * admins only (Erica's own applications, other-org prospect pipeline).
 */
export function inferOrg(granteeEmail: string, granteeOrg: string, defs: OrgDef[]): string | null {
  const em = granteeEmail.trim().toLowerCase();
  if (em) {
    for (const d of defs) {
      if (d.emailDomains.some((dom) => em.endsWith(`@${dom}`))) return d.key;
    }
  }
  const name = granteeOrg.toLowerCase();
  for (const d of defs) {
    const needles = d.nameMatch.length ? d.nameMatch : [d.name.toLowerCase()];
    if (needles.some((n) => n && name.includes(n))) return d.key;
  }
  return null;
}
