import "server-only";
import { unstable_cache } from "next/cache";
import { isDemoMode, ORG_KEYS, type OrgKey, type Scope } from "./config";
import { fixtureSnapshot } from "./fixtures";
import { fetchSnapshotFromNotion } from "./notion";
import type { Snapshot } from "./types";

async function loadSnapshot(): Promise<Snapshot> {
  if (isDemoMode()) return fixtureSnapshot();
  return fetchSnapshotFromNotion();
}

/**
 * One shared cache for all users; refreshed every 5 minutes or via the
 * Refresh button (revalidateTag). Scoping happens AFTER retrieval, in
 * scopeSnapshot — page components only ever receive already-scoped data,
 * so cross-org leakage is impossible by construction.
 */
export const getSnapshot = unstable_cache(loadSnapshot, ["notion-snapshot"], {
  revalidate: 300,
  tags: ["notion"],
});

export interface ScopedData extends Snapshot {
  scope: Scope;
  /** Orgs this viewer may see, for labels and (admin) switching. */
  visibleOrgs: OrgKey[];
}

export function scopeSnapshot(snap: Snapshot, scope: Scope): ScopedData {
  const orgs: OrgKey[] = scope === "all" ? [...ORG_KEYS] : [scope];
  const inScope = (org: OrgKey | null) =>
    scope === "all" ? true : org === scope;

  const grants = snap.grants.filter((g) => inScope(g.org));
  const grantIds = new Set(grants.map((g) => g.id));

  return {
    ...snap,
    scope,
    visibleOrgs: orgs,
    grants,
    orgFacts: snap.orgFacts.filter((f) => inScope(f.org)),
    docs: snap.docs.filter((d) => inScope(d.org)),
    // Blocks with no org relation are generic language, visible to everyone.
    blocks: snap.blocks.filter((b) => b.org === null || inScope(b.org)),
    fieldLog: snap.fieldLog.filter((r) => r.grantIds.some((id) => grantIds.has(id))),
  };
}

export async function getScopedData(scope: Scope): Promise<ScopedData> {
  return scopeSnapshot(await getSnapshot(), scope);
}
