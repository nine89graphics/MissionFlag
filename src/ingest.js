// Durable order ingestion service. The injected store MUST implement these calls
// in one atomic database transaction with a UNIQUE delivery id and order line id.
// Shopify Admin order fetch is server-side, authenticated and authoritative.
import {verifyShopifyWebhook,verifyLineAttribution} from './shopify.js';
import {fundraiserLine} from './core.js';

export async function ingestPaidOrder({
  rawBody,hmacHeader,webhookSecret,shopDomain,deliveryId,topic,
  store,fetchShopifyOrder,attributionSecret,now=new Date()
}) {
  if (!verifyShopifyWebhook({rawBody,hmacHeader,secret:webhookSecret}))
    return {status:401,reason:'Invalid webhook HMAC'};
  if(!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shopDomain||'')||
     !deliveryId||topic!=='orders/paid') return {status:400,reason:'Unsupported delivery'};
  const body=JSON.parse(Buffer.isBuffer(rawBody)?rawBody.toString('utf8'):rawBody);
  if(!body?.admin_graphql_api_id) return {status:400,reason:'Missing Shopify order id'};
  // A store must implement runTransaction with unique inbox and line constraints.
  return store.runTransaction(async tx=>{
    if(await tx.hasDelivery(deliveryId)) return {status:200,duplicate:true};
    const order=await fetchShopifyOrder(body.admin_graphql_api_id,shopDomain);
    if(!order||order.id!==body.admin_graphql_api_id||
      !['PAID','PARTIALLY_REFUNDED'].includes(order.displayFinancialStatus))
      throw new Error('Order must be fetched and paid on Shopify Admin');
    const results=[];
    for(const line of order.lineItems) {
      const attribution=verifyLineAttribution(line.customAttributes,attributionSecret,
        {orderCreatedAt:order.createdAt});
      if(!attribution) continue;
      if(line.id===undefined||line.variantId!==attribution.variantId||
        line.quantity!==attribution.quantity) throw new Error('Shopify line attribution mismatch');
      const campaign=await tx.getCampaign(attribution.campaignId);
      const proof=await tx.getApprovedProof(attribution.proofId,attribution.campaignId);
      const mapping=await tx.getCampaignVariant(attribution.campaignId,
        attribution.proofId,attribution.sizeId);
      const price=await tx.getPriceSnapshot(attribution.campaignId,attribution.sizeId,
        order.createdAt);
      if(!campaign||!proof||!mapping?.enabled||
        mapping.shopifyVariantId!==line.variantId||!price?.verified)
        throw new Error('Unknown or unapproved campaign/variant/pricing');
      if(Date.parse(order.createdAt)<Date.parse(campaign.startsAt)||
        Date.parse(order.createdAt)>=Date.parse(campaign.closesAt))
        throw new Error('Order outside campaign window');
      if(line.discountedTotalCents!==price.unitPriceCents*line.quantity)
        throw new Error('Discount changed booked fundraiser economics');
      const snapshot=fundraiserLine({...price,quantity:line.quantity});
      if(await tx.hasOrderLine(line.id)) {
        results.push({lineId:line.id,duplicate:true});continue;
      }
      await tx.insertOrderLine({
        shopifyOrderId:order.id,shopifyLineId:line.id,
        campaignId:campaign.id,proofId:proof.id,
        participantToken:attribution.participantToken,sizeId:attribution.sizeId,
        paidAt:order.createdAt,...snapshot
      });
      await tx.appendEarnings({deliveryId,lineId:line.id,campaignId:campaign.id,
        dealerId:campaign.dealerId??null,groupCents:snapshot.groupLiabilityCents,
        dealerCents:snapshot.dealerLiabilityCents});
      results.push({lineId:line.id,recorded:true});
    }
    await tx.markDelivery({deliveryId,topic,shopDomain,processedAt:now});
    return {status:200,lines:results};
  });
}
