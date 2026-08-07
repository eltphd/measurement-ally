import "server-only";
import { DATA_SOURCES, ORGS, ORG_KEYS, type OrgKey } from "./config";
import type { DocRow, FieldLogRow, Grant, LangBlock, OrgFacts, Snapshot } from "./types";

const API = "https://api.notion.com/v1";
const NOTION_VERSION = "2025-09-03";

type NotionPage = {
  id: string;
  url: string;
  properties: Record<string, any>;
};

async function queryDataSource(dataSourceId: string): Promise<NotionPage[]> {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN is not set");
  const results: NotionPage[] = [];
  let cursor: string | undefined;
  do {
    const res = await fetch(`${API}/data_sources/${dataSourceId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 }),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Notion query failed (${res.status}) for ${dataSourceId}: ${await res.text()}`);
    }
    const data = await res.json();
    results.push(...(data.results as NotionPage[]));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return results;
}

// ── Property readers ─────────────────────────────────────────────────────

const plain = (arr: any[] | undefined): string => (arr ?? []).map((t) => t?.plain_text ?? "").join("");

function title(p: any): string { return plain(p?.title); }
function text(p: any): string { return plain(p?.rich_text); }
function num(p: any): number | null { return typeof p?.number === "number" ? p.number : null; }
function select(p: any): string { return p?.select?.name ?? ""; }
function multiSelect(p: any): string[] { return (p?.multi_select ?? []).map((o: any) => o.name); }
function dateStart(p: any): string | null { return p?.date?.start ?? null; }
function dateEnd(p: any): string | null { return p?.date?.end ?? null; }
function checkbox(p: any): boolean { return !!p?.checkbox; }
function email(p: any): string { return p?.email ?? ""; }
function url(p: any): string { return p?.url ?? ""; }
function phone(p: any): string { return p?.phone_number ?? ""; }
function relationIds(p: any): string[] { return (p?.relation ?? []).map((r: any) => normId(r.id)); }

export function normId(id: string): string {
  return id.replace(/-/g, "").toLowerCase();
}

// ── Org inference ────────────────────────────────────────────────────────

export function inferOrgFromGrant(granteeEmail: string, granteeOrg: string): OrgKey | null {
  const em = granteeEmail.trim().toLowerCase();
  for (const key of ORG_KEYS) {
    if (ORGS[key].emailDomains.some((d) => em.endsWith(`@${d}`))) return key;
  }
  for (const key of ORG_KEYS) {
    if (ORGS[key].namePattern.test(granteeOrg)) return key;
  }
  return null;
}

// ── Normalizers ──────────────────────────────────────────────────────────

function toGrant(page: NotionPage): Grant {
  const p = page.properties;
  const granteeOrg = title(p["Grantee Organization"]);
  const granteeEmail = email(p["Grantee Email"]);
  return {
    id: normId(page.id),
    notionUrl: page.url,
    org: inferOrgFromGrant(granteeEmail, granteeOrg),
    granteeOrg,
    funder: text(p["Grantor/Funder"]),
    scope: text(p["Scope/Focus Area"]),
    stage: select(p["Stage"]),
    amount: num(p["Amount Requested"]),
    submissionDeadline: dateStart(p["Submission Deadline"]),
    submissionDate: dateStart(p["Submission Date"]),
    inquiryDate: dateStart(p["Date of Inquiry Submission"]),
    followUpBy: dateStart(p["Follow Up No Later Than"]),
    funded: select(p["Funded? 1"]) || null,
    finalRound: checkbox(p["Final Round Movement"]),
    granteeContact: text(p["Grantee Contact"]),
    granteeEmail,
    tags: multiSelect(p["Tags"]),
    timeline: text(p["Timeline"]),
    applyingEntity: select(p["Applying Entity"]),
  };
}

function toOrgFacts(page: NotionPage): OrgFacts {
  const p = page.properties;
  const orgName = title(p["Org Name"]);
  const edEmail = email(p["ED Email"]);
  return {
    id: normId(page.id),
    org: inferOrgFromGrant(edEmail, orgName),
    orgName,
    legalName: text(p["Legal Name"]),
    ein: text(p["EIN"]),
    yearFounded: num(p["Year Founded"]),
    address: text(p["Address"]),
    website: url(p["Website"]),
    primaryPhone: phone(p["Primary Phone"]),
    edName: text(p["ED Name"]),
    edEmail,
    edPhone: phone(p["ED Phone"]),
    fiscalContact: text(p["Fiscal Contact"]),
    fyEnd: dateStart(p["Most Recent FY End"]),
    fyRevenue: num(p["FY Revenue"]),
    fyExpenditures: num(p["FY Expenditures"]),
    operatingBudget: num(p["Annual Operating Budget"]),
    boardCount: num(p["Board Member Count"]),
    boardRace: text(p["Board Race Breakdown"]),
    boardGender: text(p["Board Gender Breakdown"]),
    staffRace: text(p["Staff Race Breakdown"]),
    staffGender: text(p["Staff Gender Breakdown"]),
    topZips: text(p["Top 3 ZIPs"]),
    guidestarUrl: url(p["GuideStar URL"]),
    lastVerified: dateStart(p["Last Verified"]),
    verifiedBy: text(p["Verified By"]),
  };
}

function toDoc(page: NotionPage, orgByPageId: Map<string, OrgKey | null>): DocRow {
  const p = page.properties;
  const orgPageIds = relationIds(p["Org"]);
  const org = orgPageIds.map((id) => orgByPageId.get(id) ?? null).find((o) => o !== null) ?? null;
  return {
    id: normId(page.id),
    org,
    orgPageIds,
    name: title(p["Doc Name"]),
    type: select(p["Type"]),
    fileLink: url(p["File Link"]),
    issueDate: dateStart(p["Issue Date"]),
    coversStart: dateStart(p["Covers Period"]),
    coversEnd: dateEnd(p["Covers Period"]),
    expires: dateStart(p["Expires / Stale After"]),
    superseded: checkbox(p["Superseded"]),
    notes: text(p["Notes"]),
  };
}

function toBlock(page: NotionPage, orgByPageId: Map<string, OrgKey | null>): LangBlock {
  const p = page.properties;
  const orgIds = relationIds(p["Org"]);
  const org = orgIds.map((id) => orgByPageId.get(id) ?? null).find((o) => o !== null) ?? null;
  return {
    id: normId(page.id),
    org,
    name: title(p["Block Name"]),
    category: select(p["Category"]),
    text: text(p["Text"]),
    notes: text(p["Notes"]),
    lastUpdated: p["Last Updated"]?.last_edited_time ?? null,
  };
}

function toFieldLog(page: NotionPage): FieldLogRow | null {
  const p = page.properties;
  const phase = select(p["Phase"]);
  if (phase !== "LOI" && phase !== "Full" && phase !== "Report") return null;
  return {
    id: normId(page.id),
    grantIds: relationIds(p["Grant"]),
    phase,
    fieldName: title(p["Field Name"]),
    value: text(p["Value Submitted"]),
    charLimit: num(p["Character Limit"]),
    submittedDate: dateStart(p["Submitted Date"]),
  };
}

// ── Snapshot ─────────────────────────────────────────────────────────────

export async function fetchSnapshotFromNotion(): Promise<Snapshot> {
  const [trackerPages, factsPages, docPages, blockPages, logPages] = await Promise.all([
    queryDataSource(DATA_SOURCES.tracker()),
    queryDataSource(DATA_SOURCES.orgFacts()),
    queryDataSource(DATA_SOURCES.docs()),
    queryDataSource(DATA_SOURCES.language()),
    queryDataSource(DATA_SOURCES.fieldLog()),
  ]);

  const orgFacts = factsPages.map(toOrgFacts);
  const orgByPageId = new Map(orgFacts.map((f) => [f.id, f.org]));

  return {
    grants: trackerPages.map(toGrant),
    orgFacts,
    docs: docPages.map((d) => toDoc(d, orgByPageId)),
    blocks: blockPages.map((b) => toBlock(b, orgByPageId)),
    fieldLog: logPages.map(toFieldLog).filter((r): r is FieldLogRow => r !== null),
    fetchedAt: new Date().toISOString(),
    demo: false,
  };
}
