-- Immutable, effective-dated pricing preserves sale-time economics.
-- All amounts are integer USD cents; no live prices are seeded here.
BEGIN;
CREATE TABLE campaign_price_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id),
  size_sku text NOT NULL REFERENCES catalog_sizes(sku),
  effective_from timestamptz NOT NULL,
  verified_at timestamptz NOT NULL,
  verified_by text NOT NULL,
  unit_price_cents bigint NOT NULL CHECK(unit_price_cents>=0),
  manufacturing_cents bigint NOT NULL CHECK(manufacturing_cents>=0),
  packing_cents bigint NOT NULL DEFAULT 0 CHECK(packing_cents>=0),
  platform_fee_cents bigint NOT NULL DEFAULT 0 CHECK(platform_fee_cents>=0),
  shipping_subsidy_cents bigint NOT NULL DEFAULT 0 CHECK(shipping_subsidy_cents>=0),
  reserve_cents bigint NOT NULL DEFAULT 0 CHECK(reserve_cents>=0),
  group_earnings_cents bigint NOT NULL CHECK(group_earnings_cents>=0),
  dealer_earnings_cents bigint NOT NULL DEFAULT 0 CHECK(dealer_earnings_cents>=0),
  min_contribution_cents bigint NOT NULL DEFAULT 0 CHECK(min_contribution_cents>=0),
  UNIQUE(campaign_id,size_sku,effective_from),
  CHECK(unit_price_cents >= manufacturing_cents+packing_cents+platform_fee_cents+
    shipping_subsidy_cents+reserve_cents+group_earnings_cents+
    dealer_earnings_cents+min_contribution_cents)
);
CREATE INDEX idx_price_asof ON campaign_price_versions
 (campaign_id,size_sku,effective_from DESC);
-- A recorded historical version must never be silently rewritten.
CREATE FUNCTION reject_price_history_edit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Verified pricing history is immutable';
END
$$;
CREATE TRIGGER price_versions_immutable BEFORE UPDATE OR DELETE ON campaign_price_versions
 FOR EACH ROW EXECUTE FUNCTION reject_price_history_edit();

ALTER TABLE order_lines ADD COLUMN price_version_id uuid REFERENCES campaign_price_versions(id);
-- A single order line can have at most one booked organization/dealer entry per webhook.
CREATE INDEX idx_paid_lines_order ON order_lines(shopify_order_id);
COMMIT;
