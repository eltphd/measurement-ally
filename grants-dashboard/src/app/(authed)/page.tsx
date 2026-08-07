import Link from "next/link";
import { ORGS, type OrgKey } from "@/lib/config";
import { getScopedData } from "@/lib/data";
import { daysLabel, daysUntil, deadlineTone, fmtDate, fmtMoney, todayET } from "@/lib/dates";
import { bucketize, cleanStage, deadlineRail, nextActionDate, sortGrants } from "@/lib/derive";
import { docHealth } from "@/lib/freshness";
import { effectiveScope, requireSession } from "@/lib/serverSession";
import { OrgFactsCard } from "@/components/OrgFactsCard";

export const dynamic = "force-dynamic";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await requireSession();
  const { org: orgParam } = await searchParams;
  const scope = effectiveScope(session, orgParam);
  const data = await getScopedData(scope);
  const today = todayET();

  const grants = sortGrants(data.grants, today);
  const rail = deadlineRail(data.grants, today);
  const buckets = bucketize(data.grants);
  const heading =
    scope === "all" ? "All client portfolios" : ORGS[scope].name;

  return (
    <main className="wrap">
      {data.demo && (
        <div className="notice warn">
          Demo mode — showing bundled sample data. Set NOTION_TOKEN to connect
          the live tracker.
        </div>
      )}

      <h1>{heading}</h1>
      <p className="sub">
        As of {new Date(data.fetchedAt).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} ET
        · updates from Notion within 5 minutes, or use Refresh above
      </p>

      {session.scope === "all" && (
        <nav className="tabs" aria-label="Organization filter">
          <Link href="/" className={scope === "all" ? "active" : ""}>All</Link>
          {(Object.keys(ORGS) as OrgKey[]).map((k) => (
            <Link key={k} href={`/?org=${k}`} className={scope === k ? "active" : ""}>
              {ORGS[k].name}
            </Link>
          ))}
        </nav>
      )}

      <h2>Coming up</h2>
      {rail.length === 0 ? (
        <div className="empty">
          Nothing due in the next 60 days. New deadlines appear here as soon as
          Erica logs them in the tracker.
        </div>
      ) : (
        <div>
          {rail.map((item, i) => (
            <div className="rail-item" key={`${item.grantId}-${item.kind}-${i}`}>
              <span className={`rail-date due ${item.tone}`}>{fmtDate(item.date)}</span>
              <span>
                <Link href={`/grants/${item.grantId}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                  {item.grantLabel}
                </Link>{" "}
                <span className="rail-kind">
                  · {item.funder} · {item.kind === "submission" ? "submission due" : "follow up"}{" "}
                  <span className={`due ${item.tone}`}>{daysLabel(item.days)}</span>
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      <h2>Portfolio</h2>
      <div className="summary">
        {buckets.map((b) => (
          <div className="cell" key={b.key}>
            <div className="n">{b.count}</div>
            <div className="label">{b.label}</div>
            <div className="money">{b.total > 0 ? fmtMoney(b.total) : "—"}</div>
          </div>
        ))}
      </div>

      <h2>Grants</h2>
      {grants.length === 0 ? (
        <div className="empty">
          No grants on the board yet for this organization. They appear here as
          soon as Erica adds them to the tracker.
        </div>
      ) : (
        grants.map((g) => {
          const next = nextActionDate(g, today);
          const days = next ? daysUntil(next, today) : null;
          const tone = deadlineTone(days);
          return (
            <div className="card" key={g.id}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
                <Link href={`/grants/${g.id}`} className="title">
                  {g.granteeOrg}
                </Link>
                <span className="badge">{cleanStage(g.stage) || "No stage"}</span>
                {scope === "all" && g.org && (
                  <span className="badge">{ORGS[g.org].name}</span>
                )}
              </div>
              <div className="meta" style={{ marginTop: 4 }}>
                {g.funder || "Funder TBD"} · {fmtMoney(g.amount)}
                {next && (
                  <>
                    {" "}·{" "}
                    <span className={`due ${tone}`}>
                      {fmtDate(next)} ({daysLabel(days!)})
                    </span>
                  </>
                )}
              </div>
              {g.scope && <div className="scope-line">{g.scope}</div>}
            </div>
          );
        })
      )}

      <h2>Documents</h2>
      {data.docs.length === 0 ? (
        <div className="empty">
          No compliance documents logged yet. Erica adds each 501(c)(3), 990,
          Good Standing certificate, and agreement to the Document Registry —
          freshness is tracked automatically here.
        </div>
      ) : (
        <div>
          {data.docs
            .filter((d) => !d.superseded)
            .map((d) => {
              const facts = data.orgFacts.find(
                (f) => d.orgPageIds.includes(f.id) || (d.org !== null && f.org === d.org),
              );
              const h = docHealth(d, facts, today);
              return (
                <div className="doc-row" key={d.id}>
                  <span className={`dot ${h.status}`} aria-label={h.status} />
                  <div className="doc-main">
                    <div>
                      {d.fileLink ? (
                        <a href={d.fileLink} target="_blank" rel="noreferrer">{d.name}</a>
                      ) : (
                        d.name
                      )}{" "}
                      <span className="meta">· {d.type}</span>
                      {scope === "all" && d.org && (
                        <span className="meta"> · {ORGS[d.org].name}</span>
                      )}
                    </div>
                    <div className="doc-reason">{h.reason}</div>
                    {h.warning && <div className="doc-warning">⚠ {h.warning}</div>}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      <h2>Organization facts</h2>
      {data.orgFacts.length === 0 ? (
        <div className="empty">
          Org facts (EIN, founding year, financials, board makeup) appear here
          once entered in the Org Facts Registry.
        </div>
      ) : (
        data.orgFacts.map((f) => <OrgFactsCard key={f.id} facts={f} />)
      )}

      <footer className="site">
        Read-only view maintained by Measurement Ally · Dr. Erica L. Tartt, PhD.
        Questions? erica@measurementally.com
      </footer>
    </main>
  );
}
