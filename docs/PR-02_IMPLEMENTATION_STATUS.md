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
