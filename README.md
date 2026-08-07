# Measurement Ally

Operations tooling for **Measurement Ally** (Dr. Erica L. Tartt, PhD) —
evaluation and grant strategy consulting for nonprofit clients.

## What's here

### [`grants-dashboard/`](grants-dashboard/README.md) — Grants Operations Dashboard

The live, client-facing grant status dashboard. Clients (NAMI Franklin
County, ArkBuilders, US-Squared, and any future org) sign in with a
magic link and see **only their own** grants, deadlines, documents, and
org facts — read straight from Erica's Notion tracker, no double entry.

- **Add a client without touching code**: add a row to the Notion
  *Org Facts Registry* with an Org Key, the org's email domains, and the
  viewer emails allowed to sign in. The dashboard picks it up within
  5 minutes.
- Deployed on Vercel; Notion is the single source of truth.
- Full setup, architecture, and maintenance guide in
  [`grants-dashboard/README.md`](grants-dashboard/README.md).

### [`docs/archive/`](docs/archive/)

Earlier material, kept for reference — including the original README for
the LTA (latent transition analysis) research-platform concept this
repository was first created for. That code was never added here; the
repo now hosts the grants dashboard.

## Contact

**Dr. Erica L. Tartt, PhD** · erica@measurementally.com
