# Grants Operations Dashboard

Read-only web dashboard that lets each of Measurement Ally's nonprofit
clients — NAMI Franklin County, ArkBuilders, US-Squared, and any org added
later — see the live status of every grant Measurement Ally runs for them.
Erica maintains everything in Notion; the dashboard reads Notion. **No
double entry, ever.**

## What it does

- **Grant status board** — every grant, org-scoped: stage, amount, deadline
  with days remaining (red < 7 days, amber 8–14), funder, scope.
- **Deadline rail** — everything due in the next 60 days, including
  follow-up dates, not just submission deadlines.
- **Portfolio summary** — count and dollar total by stage bucket.
- **Document freshness** — every compliance doc with a status light. Good
  Standing goes stale at 90 days; a 990 that doesn't cover the fiscal year
  cited on applications raises a warning automatically.
- **Org facts card** — EIN, founding year, financials, board makeup, with a
  "last verified" date.
- **Cross-phase consistency checker** (per grant) — diffs the Application
  Field Log across LOI → Full → Report and surfaces every material change:
  amounts, counts, ZIP codes, and components that quietly disappear between
  phases. Factual drift is high severity; scope/dollar changes are medium
  ("legitimate, but explain it").
- **Character-limit check** — live count against a portal cap (default
  1,000) with restatement-first trim suggestions.
- **Consultant disclosure generator** (Erica only) — the standing language,
  verbatim, in three lengths, plus the six standard portal answers.

## Where the data lives (all in Notion, under " 2026 GRANTSAPPS")

| Database | Data source ID |
| :-- | :-- |
| 💰 Grant Submissions Tracker (existing) | `f7f74e81-1f18-4cf2-a502-3f49d2a24917` |
| Org Facts Registry | `65057ab4-1ddd-45ae-bb46-a5fd39c48abb` |
| Document Registry | `6895feaf-90f8-4967-a874-5f3591f1ef57` |
| Standard Language Library | `d235f20c-26e1-4703-8de3-d49d4c58d7df` |
| Application Field Log | `a7dad9d8-c215-4cd6-b902-7af8742615fd` |

## Clients are rows, not code

The **Org Facts Registry is the client control panel**. Each row defines an
org via four columns:

| Column | Meaning | Example |
| :-- | :-- | :-- |
| `Org Key` | Short slug identifying the org | `namifc` |
| `Email Domains` | Grants whose Grantee Email ends in one of these belong to this org | `namifc.org` |
| `Viewer Emails` | Who may sign in — they see **only** this org | `rachelle@namifc.org` |
| `Name Match` | Fallback words matched against Grantee Organization titles | `nami` |

**To onboard a new client:** add a row with those four columns filled in
(plus their org facts), wait up to 5 minutes or hit Refresh, and send them
the dashboard link. That's the whole procedure. To revoke someone, remove
their email from Viewer Emails — new sign-ins stop immediately (existing
sessions age out within 30 days; rotate `SESSION_SECRET` in Vercel to cut
them off instantly).

Grants are mapped to a client org by **Grantee Email domain** first, then
by Name Match on the Grantee Organization title. Grants that match no org
(Measurement Ally's own applications, prospect pipeline for not-yet-onboarded
orgs) are visible only to Erica.

## Access

Magic-link email sign-in, no passwords. Sessions last 30 days.

- Admins (see everything): `erica@measurementally.com`,
  `ericatartt@gmail.com`, `mstartt@gmail.com`, plus anything in the
  `ADMIN_EMAILS` env var
- Clients: whoever is listed in a registry row's **Viewer Emails**
- `ALLOWLIST_JSON` env var exists as an emergency per-email override

**Org scoping is enforced by construction**: data is filtered server-side
by the session's org before any page renders; a client session pointed at
another org's grant URL gets a 404, and `?org=` switching only works for
Erica's sessions. Verified in tests and by smoke test.

## Architecture

- Next.js 15 (App Router) · plain CSS, black on white, mobile-first
- Notion API server-side only (`NOTION_TOKEN` never reaches the browser)
- **Cache: Next.js built-in server cache** — 5-minute revalidation plus a
  Refresh button (tag revalidation). *Deliberate deviation from the
  original build spec's Supabase cache: same behavior and the same "visible
  within 5 minutes or on Refresh" guarantee, with one fewer paid system to
  configure, secure, and keep in sync.* If per-view latency ever becomes a
  problem at real scale, a Supabase cache can be added behind
  `src/lib/data.ts` without touching any page.
- Magic links: signed JWTs (jose), emailed via Resend — no database at all.
- No write-back to Notion. Read-only v1, per spec.

## Run locally

```bash
cd grants-dashboard
npm install
npm run dev        # demo mode: bundled fixture data, no env needed
npm test           # 23 unit tests incl. the FaithLink consistency fixture
```

Without `NOTION_TOKEN` the app runs in **demo mode** with fixture data, and
sign-in links are printed to the server console instead of emailed.

## Deploy (Vercel, ~15 minutes)

1. **Notion integration**: create an internal integration at
   notion.so/profile/integrations → copy the token. Then open the
   " 2026 GRANTSAPPS" page in Notion → ⋯ menu → *Connections* → add the
   integration (this grants access to the tracker and all four registries
   at once).
2. **Resend**: create an API key at resend.com and verify the
   `measurementally.com` sending domain (or start with their test domain).
3. **Vercel**: import this repo, set *Root Directory* to
   `grants-dashboard`, and add env vars:
   `NOTION_TOKEN`, `SESSION_SECRET` (`openssl rand -hex 32`),
   `APP_URL` (the deployed URL), `RESEND_API_KEY`, `EMAIL_FROM`.
4. Visit the URL, sign in as erica@measurementally.com, confirm the live
   tracker appears, then send Rachelle and George the link.

## Maintaining it (Erica's workflow — nothing new to learn)

- Update grants in the **Grant Submissions Tracker** exactly as today.
  Changes appear on the dashboard within 5 minutes.
- When you submit a phase, log what you entered in the **Application Field
  Log** (field name, phase, value, char limit). That's what powers the
  consistency checker — the FaithLink Phase Two rows are already in as the
  model to copy.
- Add each compliance doc to the **Document Registry** with its Drive link
  and dates. Status lights come free.
- Note: the Field Log seed currently reflects the real LOI (4/30) and the
  final Phase Two values (8/7) — including the board-count 9 → 10 and
  session-count corrections, which the checker correctly flags as changes
  that were explained to the funder.

## Explicit non-goals (v1, per spec)

No grant-writing features, no file storage (Drive links only), no client
editing, no notifications, no auth providers beyond magic link.
