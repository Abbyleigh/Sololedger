# SoloLedger Stage 11 — Optional accounts and cloud synchronisation

Status: DESIGN ONLY. No production deployment or cloud credentials.

## Baseline
Production: https://sololedger-4lt.pages.dev/
Source of truth for production website files: SoloLedger-v0.3.3-beta.2-LegalNotice-Update-PREVIEW.zip (17 static files). This source archive is not yet imported into GitHub. Do not deploy from this repository until the source import and comparison are complete.

## Operating modes
- Guest: existing browser-local data, JSON backup/restore, no account required.
- Registered: Supabase Auth with verified email, password reset, per-account PostgreSQL records, and synchronisation.
- Keep guest mode usable with no cloud connectivity. Never silently upload guest records.

## Architecture
- Keep the existing Cloudflare Pages frontend and its financial calculation functions.
- Introduce a storage adapter interface: load, save, transact, export, delete.
- Local adapter preserves current v2 data format and financial behaviour.
- Cloud adapter maps validated entities to Postgres; enforce ownership via RLS on every table and operation.
- Use only publishable client keys in the frontend. Never commit service-role keys, secrets or real customer exports.
- Payment posting must be atomic (invoice paid status and corresponding income transaction together), idempotent and concurrency-safe.
- Invoice numbering must avoid duplicates across devices.
- Monetary amounts remain integer pence, not floating point.
- Cloud sync must resolve conflicts explicitly; do not silently overwrite.

## Data migration
1. Offer explicit guest-to-account migration with a pre-migration JSON export.
2. Validate source records and relationships.
3. Import with stable identifiers and idempotency.
4. Reconcile customer, invoice and transaction counts, totals and invoice payment links.
5. Preserve local records until user confirms successful migration and backup.

## Security acceptance criteria
- Email verification, password recovery, session expiry and sign-out.
- RLS denies unauthenticated access and cross-user reads/writes, including direct API requests.
- Auth user can delete their account and cloud records with documented retention handling.
- No third-party tracking or undisclosed analytics.
- Automated financial regression tests, guest offline tests, migration rollback and multi-device conflict tests.
- Update privacy and terms to disclose cloud storage and providers before enabling accounts.
- Verify Supabase free-tier limits, hosting region, mail quotas and backup/recovery before provisioning.

## Release gates
1. Import and review production source in GitHub.
2. Baseline test suite green.
3. Separate feature branch and draft PR.
4. Provision cloud services only after owner approval.
5. Test staging with fictional data.
6. Independent production approval; no automatic deployment or tester outreach.
