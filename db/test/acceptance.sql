-- Isolated regression fixture. Run only after 001/002/003 on disposable CI database.
DO $$
DECLARE
  v_dealer uuid;
  v_org uuid;
  v_campaign uuid;
  v_proof uuid;
  v_price uuid;
  v_line uuid;
  v_error text;
BEGIN
  INSERT INTO dealers(legal_name,approval_status) VALUES('Test partner','approved')
    RETURNING id INTO v_dealer;
  INSERT INTO organizations(display_name,organization_type,city,state_code,origin_dealer_id)
    VALUES('Test Wildcats','booster','Saginaw','MI',v_dealer) RETURNING id INTO v_org;
  INSERT INTO memberships(auth_subject,role,organization_id)
    VALUES('organizer-test','organizer',v_org);
  BEGIN
    INSERT INTO memberships(auth_subject,role,organization_id)
      VALUES('organizer-test','organizer',v_org);
    RAISE EXCEPTION 'Expected role-scope uniqueness error';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  UPDATE catalog_sizes SET enabled=true,verified_at=now(),
    shopify_variant_id='gid://shopify/ProductVariant/300',retail_cents=2500,
    production_cost_cents=700,group_earning_cents=500
    WHERE sku='garden-12x18';
  INSERT INTO campaigns(organization_id,dealer_id,slug,starts_at,closes_at,timezone,
    duration_days,status,artwork_authorized)
    VALUES(v_org,v_dealer,'test-wildcats','2026-11-01T12:00:00Z',
    '2026-11-08T12:00:00Z','America/Detroit',7,'published',true)
    RETURNING id INTO v_campaign;
  INSERT INTO design_proofs(campaign_id,style_index,revision,preview_asset_key,
    print_asset_key,status,approved_by,approved_at)
    VALUES(v_campaign,1,1,'staging/mockup.png','staging/print.tif',
    'approved','hq-test',now()) RETURNING id INTO v_proof;
  INSERT INTO campaign_variants(campaign_id,proof_id,size_sku,shopify_variant_id,enabled)
    VALUES(v_campaign,v_proof,'garden-12x18','gid://shopify/ProductVariant/300',true);
  INSERT INTO campaign_price_versions(campaign_id,size_sku,effective_from,
    verified_at,verified_by,unit_price_cents,manufacturing_cents,
    group_earnings_cents,dealer_earnings_cents,min_contribution_cents)
    VALUES(v_campaign,'garden-12x18','2026-11-01T00:00:00Z',
      '2026-10-27T00:00:00Z','hq-test',2500,700,500,100,100)
    RETURNING id INTO v_price;
  BEGIN
    UPDATE campaign_price_versions SET unit_price_cents=2600 WHERE id=v_price;
    RAISE EXCEPTION 'Expected price immutability error';
  EXCEPTION WHEN raise_exception THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    IF v_error<>'Verified pricing history is immutable' THEN RAISE; END IF;
  END;
  BEGIN
    INSERT INTO campaign_price_versions(campaign_id,size_sku,effective_from,
      verified_at,verified_by,unit_price_cents,manufacturing_cents,group_earnings_cents)
      VALUES(v_campaign,'house-24x36','2026-11-01T00:00:00Z',
        now(),'hq-test',200,700,500);
    RAISE EXCEPTION 'Expected contribution-floor error';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  INSERT INTO shopify_webhook_inbox(delivery_id,shop_domain,topic,payload,processed_at)
    VALUES('delivery-test','missionflag.myshopify.com','orders/paid',
      '{"orderGid":"gid://shopify/Order/100"}'::jsonb,now());
  INSERT INTO order_lines(shopify_order_id,shopify_line_id,campaign_id,proof_id,size_sku,
    units,merchandise_revenue_cents,direct_cost_cents,group_liability_cents,
    dealer_liability_cents,contribution_cents,price_version_id,paid_at)
    VALUES('gid://shopify/Order/100','gid://shopify/LineItem/200',v_campaign,
      v_proof,'garden-12x18',2,5000,1400,1000,200,2400,v_price,
      '2026-11-02T12:00:00Z') RETURNING id INTO v_line;
  INSERT INTO earnings_entries(order_line_id,delivery_id,beneficiary_type,
    beneficiary_id,amount_cents) VALUES
      (v_line,'delivery-test','organization',v_org,1000),
      (v_line,'delivery-test','dealer',v_dealer,200);
  IF (SELECT sum(amount_cents) FROM earnings_entries WHERE order_line_id=v_line)<>1200
    THEN RAISE EXCEPTION 'Incorrect partner/group liabilities'; END IF;
  IF (SELECT contribution_cents FROM order_lines WHERE id=v_line)<>2400
    THEN RAISE EXCEPTION 'Incorrect Mission Flag contribution'; END IF;
  IF (SELECT count(*) FROM catalog_sizes WHERE enabled)<>1
    THEN RAISE EXCEPTION 'Unexpected publication of unverified catalog'; END IF;
END
$$;
