# Mission Flag — Product Source of Truth (PR-01)
**Status:** Proposed foundation for approval in PR-01  
**Date:** 2026-10-27  
**Owner:** Mission Flag  
**Applies to:** MVP scope, architecture, product design, economics, development and launch criteria

> This is the canonical statement of product intent. Every subsequent implementation PR must reference it, preserve accepted behavior, and record intentional changes in an explicit decision log. Planning requirements are **not** claims that features have already been built.

## 1. Vision and business model

**Mission Flag makes custom school/team spirit-flag fundraising as easy to launch, share, buy from and fulfill as the best virtual fundraisers.** The experience takes inspiration from Double Good's simplicity and excitement, but uses original branding, copy, artwork and interaction design.

Mission Flag is primarily a **fundraising platform that sells flags**, with a complementary wholesale flag business. It should be operable by a small owner-led business with centralized operations, supplier production and direct-to-home fulfillment—no routine school inventory handling, sorting or hand-delivery.

Two revenue channels are required:
1. **Hosted virtual fundraisers:** An approved distributor, team apparel dealer, school, PTA/PTO, booster club, coach or organization creates a campaign. Supporters buy flags through its campaign link. Mission Flag handles checkout, supplier fulfillment, shipment tracking, reconciliation and payouts/earnings accounting.
2. **Wholesale flag orders:** Approved promotional-products distributors/team apparel dealers buy flags in quantities from a centrally controlled catalog and trade pricing engine; these purchases are not automatically fundraising sales.

**Closed e-commerce** means Mission Flag controls who creates/publishes campaigns and who has wholesale access. It does **not** mean supporters must sign in: anyone with a valid campaign link can buy through a fast, mobile-first checkout.

Mission Flag is the working product name for this initiative. Previous work may contain the label **Fundraiser Flags** or **Mission Flag Connect**; audit it for reuse before changing or retiring any functional code. Do not break working Shopify authentication, orders, fulfillment or data relationships for cosmetic renaming. Branding decisions in implementation must be consistent and separately tracked.

## 2. Who uses it and their journeys

- **Mission Flag HQ/owner:** Approves accounts and artwork, sets costs/prices/earnings, publishes campaigns, manages order exceptions, fulfillment and reconciled partner/group obligations.
- **Distributor / team apparel dealer:** Applies once, is approved, sets up multiple client fundraisers, checks status, sees attributed earnings and can order wholesale at approved pricing.
- **Organization / PTA / booster / team organizer:** Supplies basic identity, artwork and reach information; reviews proof; chooses a 7- or 14-day fundraiser; sees goal, attributable sales and group earnings.
- **Adult participant / family ambassador:** Receives a shareable link tied to a campaign, optionally identifies an adult-led team, and tracks allowed progress. Never require collecting minors' personal information.
- **Supporter:** Opens link, picks approved design and size, pays via Shopify checkout with no Mission Flag account, receives order/tracking notifications.

Product promise: **Upload your mascot, choose a style, share a link, earn for your group, and let Mission Flag handle the rest.** No separate Shopify store is needed for each dealer, school or participant.

## 3. Customer-facing marketing and experience — required

Original, visually engaging, mobile-first homepage inspired by the *experience* of Double Good:
- Clear hero, authentic spirit-flag photography/mockups, primary **Start a Fundraiser** CTA and secondary **Partner/Wholesale** entry.
- Short **how it works**: upload school/team details -> choose designs -> approved campaign goes live -> supporters shop/share -> orders ship and earnings are tracked.
- Explain benefits: no organization inventory, online payments, direct delivery, trackable fundraising progress and an easy share link.
- Explain available sizes and **only verified** per-flag group earnings; no fabricated testimonials, conversion results, number of schools, sales totals, turnaround promises or misleading "up to" claims.
- Distinct campaign storefronts, modern progress/goal indicators, clean product customization and transparent shipping/return terms.
- Fast on phones. Supporter purchase path requires minimum clicks and no mandatory account or app download.
- Accessible interactions, legible color contrast, alt text, keyboard-friendly controls and clear error handling.

No separate public generic flag marketplace is necessary for the fundraising MVP. Public purchasing happens at active, approved campaign storefronts.

## 4. The twelve signature design styles — required

**Important:** These are the twelve established *visual design style choices* offered after the organization uploads its mascot/logo and specifies school/team colors. They are different from the historical "up to 12 active designs per program" technical catalog capacity.

| # | Signature style | Visual direction / preview intent |
|---|---|---|
| 1 | Varsity Classic | Clean collegiate lettering, mascot-first school pride |
| 2 | Velocity | Fast diagonal motion and athletic energy |
| 3 | Predator | Bold mascot spotlight with intense high-contrast backdrop |
| 4 | Vortex | Circular movement emphasizing the team identity |
| 5 | Gridiron / Sport Pattern | Sport-related graphic textures adaptable by activity |
| 6 | Splatter | Energetic painted splashes in team colors |
| 7 | Ice Breaker | Sharp fractured/crystalline sports composition |
| 8 | Tie-Dye Spirit | School-color swirl and expressive fan aesthetic |
| 9 | Paint Drip | Team-color dripping paint framing mascot/type |
| 10 | Shield Pride | Badge/crest-inspired, timeless team emblem |
| 11 | Digital Camo | Digital camouflage using the school palette |
| 12 | Neon Energy | Bright-edged modern lighting/impact treatment |

Template behavior:
- Collect or reuse uploaded **official mascot/logo artwork**, primary and secondary school colors (name, HEX or reference), team/school name, sport, slogan/approved text and optional design notes.
- Show all **12 previewable style selections** with the uploaded logo/colors applied where possible; previews must be clearly labeled as proofs/mockups, not print-ready production files.
- Allow favorite selection (and optionally alternate selections); support HQ review, necessary revisions and explicit artwork approval before publication.
- Validate logo rights/authorization and output quality; offer assisted cleanup where needed. Do not claim AI-produced graphics are automatically print-ready.
- Generate art for each enabled flag size with the proper artwork safe zones, dimensions, bleed, orientation/finishing and vendor-ready requirements after approval.
- A program may publish one or multiple approved designs; existing code's **up-to-12-active-design** capacity should be reused if verified.
- A template catalog is a reusable creative system, **not** 12 unique Shopify products per team by default. Avoid variant proliferation if the current implementation already supports design × size combinations.

The twelve names above are source-of-truth; finished graphic masters, font rights, production specs and quality review are implementation deliverables rather than preexisting complete assets.

## 5. Flag catalog and fulfillment

The intended six-size product family:
1. 12 x 18 inch garden flag
2. 24 x 36 inch (2 x 3 ft) house flag
3. 3 x 5 ft spirit flag
4. 4 x 6 ft spirit flag
5. 5 x 8 ft spirit flag
6. 6 x 10 ft spirit flag

**Pilot MVP:** Fully sell and fulfill the first three sizes. Design database/catalog/pricing rules to support all six without a redesign; only publish the larger three when tested vendor specifications, shipping and net economics are entered and approved.

Each size has explicit: SKU, supplier, print construction (single/double-sided as applicable), orientation, fabric/finish, grommets/pole sleeve, cost, production SLA, package/shipping method, retail price, school earnings and whether wholesale is permitted. Do not assume all finishes or specifications fit every size. Standard 3x5 two hoist-edge grommets unless approved alternate finishing is configured.

Direct-to-home shipment is the core fundraiser experience. Order, print-file, production, carrier tracking and delivery status must remain connected. A small manual HQ exception queue is acceptable in the pilot; untracked orders are not.

## 6. Fundraiser creation and sizing questionnaire

**Design for speed: progressive intake.** Only demand what is necessary to start. Ask optional planning questions after the initial interest form rather than creating a lengthy barrier.

**Stage A — mandatory launch request**
- Organization/school/team name, type (school, PTA/PTO, booster, league, individual team, cheer/dance, band, club or community group), city/state, contact name/email and optional phone.
- Dealer/partner attribution or "I'm organizing directly".
- What the fundraiser supports and proposed fundraising goal (dollars; optional until approval).
- Logo/mascot upload or "need help"; school colors, team name/mascot, optional slogan.
- Preferred design style(s), planned 7- or 14-day duration and proposed launch date.
- Confirmation of artwork authorization, adult/organizational authority and content review.

**Stage B — planning intelligence (conditional and optional where unknown)**
- Number of **schools** covered by this campaign/district or league; number of teams and sports/activity types.
- School enrollment / **number of students** (approximate), number of **players/athletes**, or members across teams; staff/faculty; graduates/alumni/audience if relevant.
- Number of active families/households, likely parent/guardian supporters, boosters, faculty and community supporters; prior buyer count if known. Ask for *estimated unique reachable households* to avoid double-counting students on multiple teams.
- Reach channels and approximate audience: email list size, social followers, club/team group size, school communications, parent groups and whether they can distribute a QR/link.
- Fundraiser history: past campaigns, estimated units/revenue, expected participation, typical peak sports/events and any restrictions on promoting to families.
- Campaign lead, number of adult helpers, expected share days, school calendar/season, next game/event, region, proof deadline and approval contact.
- Preferred size mix, budget/price tolerance, expected local/nationwide shipping destinations; estimated wholesale needs if requested.
- Preferred recipient for payouts, payee type and payout terms **only later at verified onboarding**, not bank details in the marketing intake.

**Do not request** student names, rosters, grades, birthdates or minors' contact information. Group-level totals and adult contacts are enough for initial projections and link distribution.

**Goal and projections engine:**
- Display input totals separately from estimated *unique reachable supporters*; warn if audiences likely overlap.
- Model transparent scenarios (e.g., conservative/base/optimistic participation assumptions, purchase rate, units per order, size mix and group earnings) instead of fabricating sales estimates.
- Formula concepts: projected buyers = unique reachable households x assumed conversion; units = buyers x assumed units per order; group earnings = sum of projected units_by_size x verified group earnings_per_size. Show campaign dates, audience assumptions and shipping implications.
- Offer a tailored launch checklist: sharing cadence, QR assets, Facebook/text/email draft, adult volunteer invitations and scoreboard. No promised return on investment.
- Save these assumptions and actual results per campaign to improve later advice, preserving auditability.

## 7. Commercial pricing, commission and controls

All costs/earnings configured centrally by size and fulfillment method; a **single cost database** powers fundraiser prices and wholesale net pricing.

### Fundraising
For each **paid, eligible** order line, calculate and store a locked sale-time snapshot:
- Actual customer merchandise revenue **excluding pass-through taxes** and separately charged postage if it is not revenue retained.
- Manufacturing/print, packing, expected shipping subsidy, payment/platform fees, production handling, customer support/refund reserve and any other variable direct cost.
- Group earnings, verified **dealer referral commission** if applicable, and Mission Flag's remaining contribution.
- Include per-campaign design/setup costs and a contribution floor where relevant.
- Prevent/flag sales and promotional combinations below the defined contribution floor; zero negative-margin surprise payouts.
- Record attribution at order time; idempotently ingest paid, refund, cancellation and chargeback changes, and adjust unpaid obligations.
- Keep **group earnings, dealer earnings, amount earned vs payable vs paid** distinct. Approval/payment reconciliation is HQ-controlled initially.
- Do not advertise the historic $10–$30 or $10–$60 per-flag earnings without verifying size-specific costs/prices. Never copy Double Good's 50% claim onto this offer by assumption.

### Wholesale
- Approved trade users receive configurable quantity breaks per size/finish and published list price vs distributor net.
- Traditional promotional-products **C** pricing is 40% off *published list*, not another 40% deducted from a pre-discounted wholesale net; A/P is 50% off list if and when that tier is deliberately offered.
- Wholesale quote formula: validated cost + required contribution floor -> distributor net; derive consistent published list and applicable discount codes. Explicit freight, setup and design charges.
- Avoid a blanket 48-unit minimum where 1-unit wholesale production is viable; make small-order handling and price breaks pay for complexity.
- **Do not double compensate:** A dealer wholesale buy does not also generate a fundraiser referral commission/group payout unless intentionally sold through the platform's hosted fundraiser workflow with its own reconciled economics.

### Owners and partner relationships
- Track who owns the organization/dealer relationship and each campaign's originating partner, visibility and payout permissions.
- Simple, clear partner terms; avoid overlapping ownership of the same lead and permissions leakage among competing dealers.

## 8. System architecture — fast, controlled MVP

- **One centralized Shopify commerce store**, hidden behind a **Mission Flag branded custom fundraising front end**, handling catalog, variants, checkout, customer payment, tax/shipping calculations, orders and confirmations. Use Shopify Storefront API/cart checkout URL and Admin GraphQL operations as appropriate.
- Mission Flag application/database owns organizations, dealerships, users/roles, programs, selected designs, artwork proofs, participant links, campaigns, goals, pricing snapshots, attribution, commission/earnings ledger and operational state.
- Shopify's hosted checkout is the payment boundary; do **not** build a new payment processor or separate Shopify installations for every dealer/group.
- Retain stable external IDs and mapping of campaign + design + size + participant across checkout -> paid-order webhook -> ledger -> fulfillment. Verify webhook signatures, use idempotency/deduplication and retries; reconcile against Shopify records.
- Role-based access: HQ, approved dealer, verified adult organizer and participant. Supporters shop as guests.
- Separate **test/staging** from live, keep secrets private, apply least-privilege access and audit pricing/payout changes. Never expose one dealer's schools, orders or financial details to another.
- Existing code packages for Shopify dealer onboarding, automatic team catalog, paid-order import, fulfillment mirror, batch/evergreen logic are **reuse candidates only** until successfully checked out, compiled and tested. Do not assume a functioning deployment merely because snippets/install notes exist.

## 9. Required fundraiser flow / states

Lead -> request/intake -> HQ/dealer verification -> artwork/assets collected -> 12-style selection -> proof/approval -> size/price/earnings validation -> draft campaign -> publish -> supporters buy/share -> paid-order verification -> vendor/production -> shipping/tracking -> campaign closes -> reconciliation/returns -> group/dealer payable -> settlement -> archived/reporting.

Campaign storefront must be shareable by ordinary URL and QR code. Maintain a participant/referrer ID through shopping and paid-order attribution, with clear fallback when the customer lands without a referral.

7-day and 14-day fundraising windows are required. Closing must honor campaign timezone, prohibit further fundraiser orders after close (or use a clearly defined checkout cutoff), and reconcile orders submitted near the boundary. **Evergreen-only** and **hybrid** selling modes exist in old planning but are post-MVP enhancements; preserve recoverable work, do not let them delay the first live fundraiser.

## 10. Launch-critical reporting and operations

- HQ: campaign pipeline, approved designs, fundraiser sales, wholesale sales, manufacturing cost, postage, refunds, order statuses, contribution margin, group/dealer liabilities and reconciliation exceptions.
- Organizer: sales, goal progress, estimated/payable group earnings, share link, campaign duration and payout status with no misleading "paid" status.
- Dealer: only authorized client campaigns, wholesale pricing/orders, eligible referral earnings, deal progress and statement export later.
- Supporter: product/order details, shipping charges, expected fulfillment disclosure, order confirmation and tracking.
- Administration: ability to pause a campaign, correct attribution with audit log, mark payout approved/paid, manually reconcile shipment and reprocess failed webhooks safely.

## 11. MVP acceptance — one complete, credible fundraiser

MVP **must** demonstrate, end-to-end:
1. HQ creates or approves a single dealer and school.
2. Organizer uploads real authorized mascot/logo and school colors; selects from twelve recognizable styles; HQ generates and approves a flag proof.
3. Campaign launches with three size choices and a 7- or 14-day window; active share links/QR work.
4. Supporter buys as a guest; Shopify test order lands with right campaign/design/size/participant.
5. Paid-order event creates one—and only one—accounted order; school/dealer earnings and Mission Flag contribution calculate from configured verified costs.
6. Admin can submit an order for supplier production (manual controlled export acceptable) and record shipment/tracking.
7. Refund and cancellation adjust liabilities and do not cause duplicate orders or payouts.
8. Campaign closes and reports final orders/amount owed; separate wholesale quote/order path works at approved net prices.
9. All participant/organizer and dealer access restrictions work; mobile flow is credible and accessible.
10. A single consolidated scripted acceptance demo plus one owner sign-off replaces repetitive manual micro-tests.

**Launch definition:** Real-money checkout and public campaigns only after vendor economics, permissions, proof workflow, refund/commission handling, fulfillment/tracking, Shopify production-store status and the consolidated test suite are verified. Shopify development stores are for test orders, not real payments.

## 12. Scope guardrails and decisions

**Must for MVP:** 12 style choices, upload/colors, HQ artwork approval, 3 orderable sizes, closed campaign creation/public supporter checkout, 7/14 day campaigns, referral links, Shopify payment/orders, ledger, dealer tracking, simple wholesale orders, shipment/tracking, mobile marketing/homepage, reporting and reconciliation.

**Later:** Enable remaining 3 sizes after vendor validation, mobile apps, dealer white-label stores, fully automatic payouts, complex hybrid/evergreen schedules, gamification prizes, school district SSO, elaborate personalization, complex inventory, additional product categories. Preserve existing work and extend only as demand warrants.

**Do not invent:** supplier price tables, actual commissions, claims of fundraising results, turnaround SLA, default school reach, shipping subsidies or financial performance.

**Performance and philosophy:** Delightful ordering for 1 or 1,000 items when profitable; protect the owner's time using systemized workflows rather than inflexible minimums. Keep it simple enough to run as a focused small business.

## 13. Governance and definition of done

- This document is the canonical product source of truth for **PR-01 and future Mission Flag work**.
- See `docs/PR-01_EXECUTION_PLAN.md` for the staged batch plan, one-shot test matrix and delivery criteria.
- Product change requests should explicitly update this file in their own PR and explain which previously approved rule changes.
- Do not overwrite functioning 989Engraving, B2BBranded or legacy Fundraiser Flags code. Audit, branch, migrate intentionally, keep rollback paths.
- Questions that truly affect money flow/legal obligations must be made explicit; routine styling/technical decisions should be made with safe defaults and moved forward without serial approval requests.
