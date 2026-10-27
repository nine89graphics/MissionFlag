/**
 * PostgreSQL-backed domain transaction adapter for ingestPaidOrder().
 * Inject a dedicated server-side pg Pool; never expose a DB credential to clients.
 * Every callback is committed or rolled back atomically.
 */
function asSafeCents(value,label) {
  const n=Number(value);
  if(!Number.isSafeInteger(n)||n<0)throw new Error('Unsafe DB integer '+label);
  return n;
}
function checkedResult(result) {
  if(!result||!Array.isArray(result.rows))throw new Error('DB adapter expected query rows');
  return result.rows;
}
export function createPostgresOrderStore(pool) {
  if(!pool||typeof pool.connect!=='function')throw new Error('A PostgreSQL pool is required');
  return {
    async runTransaction(action) {
      const client=await pool.connect();
      try {
        await client.query('BEGIN');
        const query=(sql,params=[])=>client.query(sql,params);
        const lock=async key=>{
          // Serializes each logical delivery/line under concurrent Shopify retries.
          await query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[key]);
        };
        const tx={
          async hasDelivery(id) {
            await lock('delivery:'+id);
            return checkedResult(await query(
              'SELECT 1 FROM shopify_webhook_inbox WHERE delivery_id=$1',[id])).length>0;
          },
          async recordDelivery({deliveryId,shopDomain,topic,payload}) {
            await query(
              'INSERT INTO shopify_webhook_inbox(delivery_id,shop_domain,topic,payload) VALUES($1,$2,$3,$4::jsonb)',
              [deliveryId,shopDomain,topic,JSON.stringify(payload)]);
          },
          async getCampaign(id) {
            const rows=checkedResult(await query(
              'SELECT id, organization_id, dealer_id, status, starts_at, closes_at FROM campaigns WHERE id=$1',[id]));
            const row=rows[0];
            return row&&{id:row.id,organizationId:row.organization_id,
              dealerId:row.dealer_id,status:row.status,
              startsAt:row.starts_at,closesAt:row.closes_at};
          },
          async getApprovedProof(id,campaignId) {
            const rows=checkedResult(await query(
              "SELECT id FROM design_proofs WHERE id=$1 AND campaign_id=$2 AND status='approved' AND approved_at IS NOT NULL",
              [id,campaignId]));
            return rows[0]&&{id:rows[0].id,status:'approved'};
          },
          async getCampaignVariant(campaignId,proofId,sizeId) {
            const rows=checkedResult(await query(
              'SELECT v.shopify_variant_id FROM campaign_variants v JOIN catalog_sizes s ON s.sku=v.size_sku AND s.enabled=true AND s.verified_at IS NOT NULL WHERE v.campaign_id=$1 AND v.proof_id=$2 AND v.size_sku=$3 AND v.enabled=true',
              [campaignId,proofId,sizeId]));
            return rows[0]&&{enabled:true,shopifyVariantId:rows[0].shopify_variant_id};
          },
          async getPriceSnapshot(campaignId,sizeId,asOf) {
            const rows=checkedResult(await query(
              'SELECT * FROM campaign_price_versions WHERE campaign_id=$1 AND size_sku=$2 AND effective_from<=$3::timestamptz ORDER BY effective_from DESC LIMIT 1',
              [campaignId,sizeId,asOf]));
            const row=rows[0];if(!row)return null;
            const keys=['unit_price_cents','manufacturing_cents','packing_cents',
              'platform_fee_cents','shipping_subsidy_cents','reserve_cents',
              'group_earnings_cents','dealer_earnings_cents','min_contribution_cents'];
            const amounts=Object.fromEntries(keys.map(key=>[key,asSafeCents(row[key],key)]));
            return {verified:true,priceVersionId:row.id,
              unitPriceCents:amounts.unit_price_cents,
              manufacturingCents:amounts.manufacturing_cents,
              packingCents:amounts.packing_cents,
              platformFeeCents:amounts.platform_fee_cents,
              shippingSubsidyCents:amounts.shipping_subsidy_cents,
              reserveCents:amounts.reserve_cents,
              groupEarningsCents:amounts.group_earnings_cents,
              dealerEarningsCents:amounts.dealer_earnings_cents,
              minContributionCents:amounts.min_contribution_cents};
          },
          async hasOrderLine(id) {
            await lock('line:'+id);
            return checkedResult(await query(
              'SELECT 1 FROM order_lines WHERE shopify_line_id=$1',[id])).length>0;
          },
          async insertOrderLine(line) {
            if(!line.priceVersionId)throw new Error('Cannot book sale without immutable pricing version');
            const sql=[
              'INSERT INTO order_lines (shopify_order_id,shopify_line_id,campaign_id,proof_id,',
              'size_sku,units,merchandise_revenue_cents,direct_cost_cents,',
              'group_liability_cents,dealer_liability_cents,contribution_cents,',
              'paid_at,price_version_id,ambassador_id)',
              'VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,',
              '(SELECT id FROM adult_ambassadors WHERE campaign_id=$3 AND referral_token=$14 LIMIT 1))'
            ].join(' ');
            await query(sql,[line.shopifyOrderId,line.shopifyLineId,line.campaignId,
              line.proofId,line.sizeId,line.quantity,line.revenueCents,
              line.directCostCents,line.groupLiabilityCents,line.dealerLiabilityCents,
              line.contributionCents,line.paidAt,line.priceVersionId,
              line.participantToken||'']);
          },
          async appendEarnings({deliveryId,lineId,campaignId,dealerId,groupCents,dealerCents}) {
            const rows=checkedResult(await query(
              'SELECT l.id,c.organization_id,c.dealer_id FROM order_lines l JOIN campaigns c ON c.id=l.campaign_id WHERE l.shopify_line_id=$1 AND l.campaign_id=$2',
              [lineId,campaignId]));
            const row=rows[0];if(!row)throw new Error('Missing booked order line');
            if((row.dealer_id||null)!==(dealerId||null))
              throw new Error('Dealer attribution mismatch');
            if(groupCents>0)await query(
              "INSERT INTO earnings_entries(order_line_id,delivery_id,beneficiary_type,beneficiary_id,amount_cents) VALUES($1,$2,'organization',$3,$4)",
              [row.id,deliveryId,row.organization_id,groupCents]);
            if(dealerCents>0) {
              if(!row.dealer_id)throw new Error('Dealer earnings require attributed dealer');
              await query(
                "INSERT INTO earnings_entries(order_line_id,delivery_id,beneficiary_type,beneficiary_id,amount_cents) VALUES($1,$2,'dealer',$3,$4)",
                [row.id,deliveryId,row.dealer_id,dealerCents]);
            }
          },
          async markDelivery({deliveryId,processedAt}) {
            const rows=checkedResult(await query(
              'UPDATE shopify_webhook_inbox SET processed_at=$2 WHERE delivery_id=$1 AND processed_at IS NULL RETURNING delivery_id',
              [deliveryId,processedAt]));
            if(rows.length!==1)throw new Error('Could not finalize inbox delivery');
          }
        };
        const result=await action(tx);
        await client.query('COMMIT');
        return result;
      } catch(error) {
        try {await client.query('ROLLBACK');}catch {/* original error wins */}
        throw error;
      } finally {client.release();}
    }
  };
}
