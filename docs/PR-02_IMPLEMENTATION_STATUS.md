# PR-02 — Recovery audit and initial foundation (in progress)

## Verified sources
- PR-01 remains the product specification and execution plan; PR-02 branches from its head and targets that planning branch until PR-01 is merged.
- MissionFlag main had only README when reviewed; no app checkout, schema, Shopify auth or webhook integrations have been proven available.
- Accessible repositories include 989engraving and B2B-Branded-Development, which are unrelated active codebases. No files or secrets were copied from or changed in those projects.
- Historical Shopify/Fundraiser Flags source and deployment were not found in the MissionFlag repository. Recovery remains open; avoid claiming prior functionality is present.

## Implemented foundation
- Original twelve style names and six flag sizes (three initially intended for MVP, **none sale-enabled until pricing/vendor verification**).
- Pure campaign lifecycle rules, publication safety gate, configurable integer-cent fundraiser economics, published-list C discount (40%), supporter estimates and default-deny role checks.
- Deterministic paid/refund event reducer with deduplication and refunds bounded to paid units, for adapter-level development.
- Dependency-free Node unit tests; run `npm test`. CI executes this on pushes and PRs.

## Gaps / not yet live
- Durable transactional DB, secure media uploads, real style artwork/proofs, actual authorization/session binding, Shopify Storefront/Admin APIs and authenticated webhooks, hosted checkout, supplier purchase orders, tracking, financial payouts, wholesale UI and staging deployment are **not built**.
- Domain timestamps are absolute ISO instants. A future scheduling adapter must convert organizer local timezone (including DST), verify close on server, and enforce checkout cutoff.
- Reducer models whole-unit refunds only; Shopify partial amount refunds/line-level allocations, charges and inventory reconciliation require richer ledger events.
- Product cost and payout amounts are deliberately NOT seeded from old guesses. Supplier costs, payment fees, shipping and payout policy need verification before public pricing.
- This is a first foundation commit, not full Batch 1 acceptance or launch readiness.

## Roadmap and gates
1. **Complete Batch 0/1:** recover historical code where actually accessible; choose host/DB, add migration and transactional order inbox/outbox, role-bound auth, organization/dealer/campaign records, secure logo upload, style preview pipeline, proofs and variant mapping.
2. **Batch 2:** branded site, progressive intake, 7/14-day campaigns, supporter links, Shopify cart & test checkout, signed webhooks and accurate attribution.
3. **Batch 3:** production export/fulfillment/tracking, refund reconciliation, earnings dashboards, approval/payable lifecycle and separate margin-protected wholesale quotes/orders.
4. **Batch 4:** one controlled, scripted end-to-end staging scenario and single owner pilot launch gate.

## Required external validation before real purchases
Verified supplier costs/finishes/production SLA; Shopify test/live eligibility, store credentials and variant IDs; payout terms; logo authorization; payment and shipping configuration; shipping handoff. No live payment or deployment mutations were made.

## Progress addendum — approved kickoff (2026-10-27)
- PR-01 has been merged onto `main`. PR-02 now targets `main`.
- Vercel project `missionflag` is present, but project metadata shows `live: false`; a READY preview/build status alone does not establish a working application or real checkout.
- `src/shopify.js`: server-side guest cart builder using Shopify Storefront API `cartCreate`, approved proof/campaign checks, signed line attribution, and raw-byte Shopify webhook HMAC validation. Requires actual Shopify credentials, trusted persistent mappings and an HTTP runtime before it can handle real orders.
- `src/intake.js`: optional reach metrics and household-based projections that do not invent conversion results or collect student rosters.
- `db/migrations/001_initial.sql`: relational schema for dealers, organizations, scoped memberships, verified sizes, campaigns, artwork revisions, adult share tokens, durable webhook inbox, sale-time snapshot lines, append-only group/dealer earnings deltas, payout records, fulfillment and audit events. The schema is not applied to any production database.
- CI now has Node unit tests and disposable PostgreSQL migration smoke validation. Passing CI is not a hosted Shopify end-to-end test.

### Next implementation work (not yet claimed complete)
1. Connect approved app-auth/identity provider with enforced route-level and tenant-level isolation; implement form endpoints, object storage and real thumbnail/proof generation.
2. Wire a real transactional database/service and Shopify Admin-order reconciliation with authentic signed delivery IDs; do not credit earnings purely from customer-editable attributes.
3. Build campaign/organizer/HQ UI and launch one approved pilot through a verified Shopify test shop and supplier export.
4. Validate financial payouts, shipping costs, refunds, manual exceptions and three size SKUs before production enablement.

No changes were made to unrelated projects or to live payment settings.

## Approved Batch 1 engineering expansion — 2026-10-27
- The initial foundation/test/migration checks have passed in GitHub Actions.
- `db/migrations/003_immutable_prices.sql` defines immutable, approved historical campaign prices. The order adapter selects only pricing effective and verified as of the Shopify order time.
- `src/postgres-store.js` implements the order ingestion transaction contract with advisory locks, scoped campaign/proof/variant reads, sale-time price snapshots, inbox processing, append-only beneficiary earnings and rollback on failure.
- `src/admin-order.js` reads Shopify Admin GraphQL orders and subtracts **all discount allocations**, preventing under-detection of order-level discounts. It rejects truncated line pages and non-USD / imprecise money.
- `src/storefront.js` resolves all publishable campaign/proof/variant values server-side before creating a guest cart. Never trust cart client-supplied prices or variants.
- `src/style-previews.js` generates twelve numbered 12x18 SVG concept thumbnails using actual organization text, HEX colors and preserved aspect-ratio official raster logos. These are NOT finished 110gsm vendor print files or photorealistic final mockups.
- `db/test/acceptance.sql` checks database role uniqueness, contribution margin floor, immutable prices, six-size gating and sample order/earnings snapshot on disposable PostgreSQL.
- Connected Vercel project `missionflag` was inspected: no environment variables are configured. No Shopify Admin/Storefront credentials or staging database binding are established there. No real Shopify test sale, media upload, production fulfillment or deployed secure organizer portal has been proven.
- The published checkout cutoff **cannot be guaranteed** solely by pre-creating a Shopify cart. Hosted checkout may finish after a campaign expires; settlement must reconcile captured paid time and define a safe expired-cart rule before live launch.

### Release state
The code is usable for CI-verified domain and integration-adapter development but has **not** completed Batch 1 acceptance. PR-02 remains draft. Do not merge or turn on real-money transactions solely because mock/SQL tests pass.

### Next cohesive work
Secure identity and scoped database access; true uploaded-logo storage/proof approval; public fundraiser onboarding and campaign storefront UI; an authenticated HTTP runtime; connected Shopify test store and staged database. Then run the full end-to-end pilot including shipping and refund reversal.
