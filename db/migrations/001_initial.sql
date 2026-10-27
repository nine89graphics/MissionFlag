-- Mission Flag PostgreSQL foundation. Apply only to a dedicated STAGING database first.
-- Designed for transactional application access, NOT directly exposed to browsers.
-- Roles/policies and immutable money event processing are enforced by server adapters.
BEGIN;

CREATE TABLE dealers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  approval_status text NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending','approved','suspended')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  organization_type text NOT NULL,
  city text NOT NULL,
  state_code text NOT NULL,
  origin_dealer_id uuid REFERENCES dealers(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_subject text NOT NULL,
  role text NOT NULL CHECK (role IN ('hq','dealer','organizer')),
  dealer_id uuid REFERENCES dealers(id),
  organization_id uuid REFERENCES organizations(id),
  UNIQUE (auth_subject,role,dealer_id,organization_id),
  CHECK (
    (role='hq' AND dealer_id IS NULL AND organization_id IS NULL)
    OR (role='dealer' AND dealer_id IS NOT NULL AND organization_id IS NULL)
    OR (role='organizer' AND organization_id IS NOT NULL AND dealer_id IS NULL)
  )
);
CREATE INDEX idx_memberships_subject ON memberships(auth_subject);

CREATE TABLE catalog_sizes (
  sku text PRIMARY KEY,
  label text NOT NULL,
  initial_mvp boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT false,
  supplier_id text,
  print_finish text,
  shopify_variant_id text UNIQUE,
  production_cost_cents bigint CHECK (production_cost_cents>=0),
  retail_cents bigint CHECK (retail_cents>=0),
  group_earning_cents bigint CHECK (group_earning_cents>=0),
  dealer_earning_cents bigint CHECK (dealer_earning_cents>=0),
  minimum_contribution_cents bigint NOT NULL DEFAULT 0
    CHECK (minimum_contribution_cents>=0),
  verified_at timestamptz,
  CHECK (NOT enabled OR (
    verified_at IS NOT NULL AND shopify_variant_id IS NOT NULL
    AND production_cost_cents IS NOT NULL AND retail_cents IS NOT NULL
    AND group_earning_cents IS NOT NULL
  ))
);
INSERT INTO catalog_sizes (sku,label,initial_mvp) VALUES
  ('garden-12x18','12×18 Garden',true),
  ('house-24x36','24×36 House',true),
  ('pole-3x5','3×5 Pole',true),
  ('pole-4x6','4×6 Pole',false),
  ('pole-5x8','5×8 Pole',false),
  ('pole-6x10','6×10 Pole',false);

CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  dealer_id uuid REFERENCES dealers(id),
  slug text NOT NULL UNIQUE,
  fundraising_purpose text,
  starts_at timestamptz NOT NULL,
  closes_at timestamptz NOT NULL,
  timezone text NOT NULL,
  duration_days integer NOT NULL CHECK (duration_days IN (7,14)),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','review','published','paused','closed','settled')),
  group_goal_cents bigint CHECK (group_goal_cents>=0),
  school_count integer CHECK (school_count>=0),
  student_count integer CHECK (student_count>=0),
  team_count integer CHECK (team_count>=0),
  player_count integer CHECK (player_count>=0),
  unique_household_estimate integer CHECK (unique_household_estimate>=0),
  primary_color text,
  secondary_color text,
  logo_asset_key text,
  artwork_authorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (closes_at>starts_at)
);
CREATE INDEX idx_campaign_organization ON campaigns(organization_id);
CREATE INDEX idx_campaign_dealer ON campaigns(dealer_id);

CREATE TABLE design_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id),
  style_index integer NOT NULL CHECK (style_index BETWEEN 1 AND 12),
  revision integer NOT NULL CHECK (revision>=1),
  preview_asset_key text NOT NULL,
  print_asset_key text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','awaiting_review','approved','rejected')),
  approved_by text,
  approved_at timestamptz,
  UNIQUE(campaign_id,style_index,revision),
  CHECK ((status='approved' AND approved_at IS NOT NULL AND approved_by IS NOT NULL)
    OR status<>'approved')
);
CREATE TABLE campaign_variants (
  campaign_id uuid NOT NULL REFERENCES campaigns(id),
  proof_id uuid NOT NULL REFERENCES design_proofs(id),
  size_sku text NOT NULL REFERENCES catalog_sizes(sku),
  shopify_variant_id text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  PRIMARY KEY (campaign_id,proof_id,size_sku)
);

CREATE TABLE adult_ambassadors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id),
  referral_token text NOT NULL UNIQUE,
  adult_display_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- A webhook delivery is recorded before processing; retry state is durable.
CREATE TABLE shopify_webhook_inbox (
  delivery_id text PRIMARY KEY,
  shop_domain text NOT NULL,
  topic text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processing_error text
);
CREATE INDEX idx_webhook_pending ON shopify_webhook_inbox(received_at)
  WHERE processed_at IS NULL;

-- Values are snapshotted when orders are verified against the Shopify source.
-- Never recalculate historical earnings from current size pricing.
CREATE TABLE order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_order_id text NOT NULL,
  shopify_line_id text NOT NULL UNIQUE,
  campaign_id uuid REFERENCES campaigns(id),
  proof_id uuid REFERENCES design_proofs(id),
  ambassador_id uuid REFERENCES adult_ambassadors(id),
  size_sku text NOT NULL REFERENCES catalog_sizes(sku),
  units integer NOT NULL CHECK (units>=1),
  refunded_units integer NOT NULL DEFAULT 0 CHECK (refunded_units>=0),
  merchandise_revenue_cents bigint NOT NULL CHECK (merchandise_revenue_cents>=0),
  direct_cost_cents bigint NOT NULL CHECK (direct_cost_cents>=0),
  group_liability_cents bigint NOT NULL CHECK (group_liability_cents>=0),
  dealer_liability_cents bigint NOT NULL CHECK (dealer_liability_cents>=0),
  contribution_cents bigint NOT NULL CHECK (contribution_cents>=0),
  paid_at timestamptz NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  CHECK (refunded_units<=units),
  CHECK (merchandise_revenue_cents=direct_cost_cents+group_liability_cents+
    dealer_liability_cents+contribution_cents)
);
CREATE INDEX idx_order_lines_campaign ON order_lines(campaign_id);

-- All earnings deltas are append-only; refund reversals are negative entries.
-- Do not treat these entries as proof of an actual bank payout.
CREATE TABLE earnings_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_line_id uuid NOT NULL REFERENCES order_lines(id),
  delivery_id text NOT NULL REFERENCES shopify_webhook_inbox(delivery_id),
  beneficiary_type text NOT NULL CHECK (beneficiary_type IN ('organization','dealer')),
  beneficiary_id uuid NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents<>0),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_line_id,delivery_id,beneficiary_type,beneficiary_id)
);
CREATE INDEX idx_earnings_beneficiary ON earnings_entries(beneficiary_type,beneficiary_id);

CREATE TABLE payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_type text NOT NULL CHECK (beneficiary_type IN ('organization','dealer')),
  beneficiary_id uuid NOT NULL,
  approved_amount_cents bigint NOT NULL CHECK (approved_amount_cents>0),
  status text NOT NULL DEFAULT 'approved'
    CHECK (status IN ('approved','sent','reconciled','void')),
  external_reference text,
  approved_by text NOT NULL,
  approved_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz
);
CREATE TABLE fulfillment_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_order_id text NOT NULL,
  supplier_reference text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','exported','in_production','shipped','delivered','exception')),
  carrier text,
  tracking_number text,
  tracking_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shopify_order_id)
);
CREATE TABLE audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_subject text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  before_snapshot jsonb,
  after_snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
