-- Extend pilot foundation with auditable Shopify refund events and settlement holds.
-- Staging migration only. Immutable invoice/earnings snapshot logic lives in service.
BEGIN;
CREATE TABLE shopify_refund_events (
  shopify_refund_id text PRIMARY KEY,
  shopify_order_id text NOT NULL,
  delivery_id text NOT NULL REFERENCES shopify_webhook_inbox(delivery_id),
  processed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE refund_line_adjustments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  shopify_refund_id text NOT NULL REFERENCES shopify_refund_events(shopify_refund_id),
  shopify_line_id text NOT NULL REFERENCES order_lines(shopify_line_id),
  units integer NOT NULL CHECK(units>0),
  refunded_merchandise_cents bigint NOT NULL CHECK(refunded_merchandise_cents>=0),
  group_reversal_cents bigint NOT NULL CHECK(group_reversal_cents>=0),
  dealer_reversal_cents bigint NOT NULL CHECK(dealer_reversal_cents>=0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shopify_refund_id,shopify_line_id)
);
CREATE INDEX idx_refund_adjustments_line ON refund_line_adjustments(shopify_line_id);
ALTER TABLE order_lines ADD COLUMN shipping_status text NOT NULL DEFAULT 'pending'
 CHECK (shipping_status IN ('pending','production','shipped','delivered','exception'));
CREATE TABLE settlement_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_type text NOT NULL CHECK (beneficiary_type IN ('organization','dealer')),
  beneficiary_id uuid NOT NULL,
  campaign_id uuid REFERENCES campaigns(id),
  reason text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  released_by text,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (released_at IS NULL OR (NOT active AND released_by IS NOT NULL))
);
CREATE INDEX idx_active_holds ON settlement_holds(beneficiary_type,beneficiary_id)
 WHERE active=true;
COMMIT;
