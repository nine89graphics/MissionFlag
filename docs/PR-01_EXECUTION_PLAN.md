# PR-01 — Mission Flag MVP Execution Plan (Batch-first)
**Status:** Proposed / non-deploying planning PR  
**Date:** 2026-10-27  
**Canonical requirements:** [MISSION_FLAG_SOURCE_OF_TRUTH.md](MISSION_FLAG_SOURCE_OF_TRUTH.md)

## Outcome and scope

Make **one honest, beautiful, working Mission Flag fundraiser** and a **minimal approved-distributor wholesale order path**. This PR itself only establishes the plan/source of truth and performs **no deployments, checkout modifications or production data migrations**.

We are building a **closed campaign-creation/open supporter-purchase** platform inspired by the usability of Double Good, not reproducing its assets or UX code. One centralized Shopify commerce back end, custom Mission Flag branded front end, and owner-led fulfillment/reconciliation.

### Fastest testable value
One authorized dealer + one school/organization + one approved mascot design + **12 selectable style previews** + **three buyable flag sizes** + one published campaign + share/participant links + test checkout + correct ledger + shipping workflow + one wholesale quote.

Keep all six flag size configurations in the model, but only sell fully validated sizes. Fundraiser launches can be 7 or 14 days.

## Inventory / recovery before adding application code (Batch 0)

1. Inspect the **current original Fundraiser Flags / Mission Flag Shopify app** and existing source artifacts before deciding whether to reuse, fork or migrate them. Preserve known-working authentication, dealer/HQ roles, auto team catalog, design mapping, paid-order webhooks, production mirroring, shipping and tracking. Confirm local/source version, packages, test coverage, deployment and database; do not infer working code from install notes.
2. Verify actual Shopify development/test store, live store eligibility, hosting, current schemas/secrets and fulfillment vendors. Use available installed credentials; do not demand manual steps unless genuinely necessary.
3. Establish staging/test separation, GitHub protection and a small smoke-test command. Do not change unrelated 989Engraving, B2BBranded or CloserWell apps.
4. Issue **one concise discrepancy report** if recovered code differs from the source of truth. Resolve routine implementation choices without repeated approvals.

**Gate:** Existing assets classified as reusable / needs repair / not available. This gate prevents unnecessary rewrites; it is not a request for multiple screen-by-screen confirmations.

## Implement in cohesive batches (not one PR per button)

### Batch 1 — foundation, data and reusable design assets
- App identity/navigation/roles, campaign + organization + dealer + participant data model, Shopify product/variant mapping and webhook idempotency.
- Central cost ledger and quoting engine with product-size cost/price/earnings records, sales-time price snapshots, contribution floor, dealer attribution, refundable liabilities and audit trails.
- Six catalog sizes modeled; first three vendor validated and configured.
- Upload logo/mascot and school colors; twelve named style cards with previews that meaningfully incorporate branding; proof approval versioning and manual HQ override.
- Basic 7/14-day campaign lifecycle, timezone-aware launch/close and referral token architecture.
- Build checks, fixture generation and migrations with rollback plan.

**Automated acceptance:** Unit tests for tier pricing, commissions, payout/fee floors, order attribution, role authorization, duplicate event handling and 12 templates; schema migration/smoke tests.

### Batch 2 — full public fundraising journey
- Marketing homepage based on the clear four-step value proposition (original creative), clear Start Fundraiser and Distributor/Wholesale CTAs.
- Fast Stage A intake, optional progressive Stage B questionnaire including **schools / students / teams / players / households / unique supporter reach / alumni**; goal setting and scenario estimator with non-guaranteed conversion assumptions.
- Dealer and organizer workspaces, intake review, art upload/style selection/proof approval, HQ publishing control.
- Campaign product pages, participant links + QR, goal/earnings progress, one-cart Shopify Storefront API integration and guest checkout.
- Shopify paid-order/refund/cancellation webhooks, consistent attribution and published campaign cutoff logic.

**Automated acceptance:** One seeded school fundraiser plus adult participant, valid/invalid media upload, all twelve styles, sizes, authorized/unauthorized access, Shopify test cart/order, duplicate webhook, close-boundary test.

### Batch 3 — production, reporting and wholesale
- Supplier handoff/export (manual is acceptable with controls), shipping/tracking updates to Shopify and Mission Flag, error/exception queue.
- HQ/organizer/dealer reporting: actual sales, group earned/payable/paid, dealer earned/payable/paid, revenue, shipping, cost, contribution and reconciliation.
- Finance exception rules for returned/refunded orders; payable lock/review; clear statement that owed is not already paid.
- Approved wholesale order entry with quantity net-price breaks, published list/C-code where configured, freight/setup lines, HQ review and Shopify record. Wholesale does not create fundraising liabilities unless explicitly a fundraiser transaction.
- Simple launch assets: unique link, QR, text/social/email sharing copy, optional adult ambassador invitation.

**Automated acceptance:** Wholesale C-code calculation (40% off list, never double discount), one-item vs bulk margin floors, shipping/exceptions, partial refund, order ledger consistency, role isolation and payout reconciliation.

### Batch 4 — consolidated validation and pilot release
- Run a **single scripted end-to-end scenario** with one dealer, one school, representative counts, authentic school-authorized mascot/colors, 12 style previews, one approved design, three sizes, 7-/14-day variants, participant attribution, multiple **Shopify test** orders, order exceptions, duplicate webhooks, a refund, shipment, and campaign close.
- Repeat the *same* shared acceptance suite across staging fixes instead of requesting one manual click per small change.
- Perform responsive/a11y/security checks, financial ledger spot checks, test order/reconciliation verification and launch readiness checklist in a single report.
- Demonstrate to the owner **once per meaningful milestone**; batch feedback into a focused revision PR. Owner only needs to intervene on critical choices (production money movement, contracts, irreversible deletion, app credentials, domain and go-live approval).
- After test suite passes and checkout/merchant/vendor prerequisites are verified, conduct a **controlled real-money, real-fulfillment pilot** with one partner/group before broad public signup.

**Go/no-go conditions:**
- No paid order lost or duplicated; refunds reverse amounts owed safely.
- Fulfillment can be completed, tracked and reconciled.
- Margins/fees/shipping verified for the three live sizes; accurate supporter-visible pricing.
- All 12 templates are selectable and generate an approved production-ready proof pathway.
- Guest checkout and organizer/dealer permissions verified.
- No fabricated results/claims; support/returns/payout terms visible.
- Real production payments do not use a Shopify dev store.

## Explicit owner action budget

- **No recurring "approved?" for routine engineering.**
- Provide **one plan + one consolidated execution review per batch**, unless a material risk/technical blocker requires a decision.
- Use migrations, test fixtures, automated regression, integration runs and realistic seed data.
- Track all checklist outcomes in one PR summary, not dozens of disconnected chat messages.
- Commit cohesive changes, respect existing PR boundaries and protect deployed systems. Never silently delete/replace a functioning component.
- Surface only items that must be supplied by owner: verified flag supplier pricing/SLAs, business commission/group payout commitments, production Shopify checkout authorization, brand asset rights, and launch credentials where unavailable.

## Campaign strategy / estimated potential model (pilot)

Store group-level counts; do not collect minors' personally identifying information.

Inputs: number of schools, estimated students, teams, players, booster households, alumni and other unique reachable families; prior buyers, social/email share reach, campaign length/season, number of adult helpers, flag size mix and target earnings.

Illustrative derived fields (not promises):
- Estimated **unique reachable** buying households, not sum of overlapping students and players.
- Low/base/high conversion **assumptions** that organizers can change (e.g. 2%, 5%, 10%).
- Unit estimates using estimated households × conversion × units per purchasing household.
- Projected group earnings using verified size-specific earnings × expected size mix.
- Estimated share workload / schedule and a goal feasibility signal; flag missing data instead of guessing.

Do not use unverified projected returns in public marketing. First pilot collects actual funnel data to recalibrate estimates.

## Must-have UX routes (conceptual; implementation can adapt to existing app)

- Public: `/` (homepage), `/start` (initial intake), `/f/:slug` (approved campaign storefront), `/f/:slug/share` (sharing), checkout handoff.
- Partner: `/partner/apply`, `/partner/dashboard`, `/partner/fundraisers`, `/partner/wholesale`.
- Organizer: `/organization/dashboard`, `/organization/fundraisers/:id`, proof selection and goal reporting.
- HQ: `/hq` (review queue, vendors, pricing, ledger, refunds, orders, shipping).

Routes are suggestions, **not** a mandate to rename any recovered working routes.

## Design / product acceptance checklist
- [ ] Home communicates **raise funds by selling custom spirit flags** in under a glance
- [ ] Custom mascot/logo uploaded; colors saved; rights confirmation collected
- [ ] 12 exact signature styles visible: Varsity Classic, Velocity, Predator, Vortex, Gridiron / Sport Pattern, Splatter, Ice Breaker, Tie-Dye Spirit, Paint Drip, Shield Pride, Digital Camo, Neon Energy
- [ ] Proof uploaded/rendered, reviewed, versioned and approved before selling
- [ ] 12×18 garden, 24×36 house, 3×5 spirit flag tested at supplier and priced; other 3 sizes modeled
- [ ] School counts + team/player/student/household questions support optional sizing estimates
- [ ] Organizer can open 7- or 14-day program and create/share URL + QR
- [ ] Supporters purchase as guests; proper campaign, design, size and participant attribution is retained
- [ ] One Shopify test checkout/order/refund/ship sequence and duplicate webhook handling passes
- [ ] Group/dealer payable figures reconciled; owner contribution never obscured
- [ ] C-code wholesale is based on list and amount saved per order, without double discounts
- [ ] One consolidated test report, then owner demo and launch gate

## Out-of-scope until the pilot proves itself

Native iOS/Android app, automated split payouts, separate dealer Shopify instances, giant wholesale catalog, paid gamification rewards, detailed school/student contact databases, automated district SSO, additional merchandise categories, and broad evergreen/hybrid redesign. Recover past work but do not let these delay launch.

## Next engineering PR

**PR-02: Recover/build Batch 0 + Batch 1** on a fresh branch, including a single status report and automated test commands. PR-01 approval establishes scope; it does not imply any app is live.
