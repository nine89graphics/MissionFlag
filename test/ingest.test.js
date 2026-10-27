import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {signedLineAttributes} from '../src/shopify.js';
import {ingestPaidOrder} from '../src/ingest.js';
const secret='test-only-secret';
const closesAt=Date.parse('2026-11-15T12:00:00Z');
const attrs=signedLineAttributes({campaignId:'c1',proofId:'p1',sizeId:'garden-12x18',
  participantToken:'adult1',variantId:'gid://shopify/ProductVariant/123',quantity:2,closesAt},secret);
const body=JSON.stringify({admin_graphql_api_id:'gid://shopify/Order/1'});
const hmac=createHmac('sha256',secret).update(body).digest('base64');
function fixture(){
 const state={deliveries:new Set(),lines:new Set(),earnings:[]};
 const order={id:'gid://shopify/Order/1',displayFinancialStatus:'PAID',
   createdAt:'2026-11-10T12:00:00Z',lineItems:[{
     id:'gid://shopify/LineItem/1',variantId:'gid://shopify/ProductVariant/123',
     quantity:2,discountedTotalCents:5000,customAttributes:attrs
   }]};
 const store={runTransaction:async fn=>{
   // This fake DB is for domain contracts; real adapter needs SQL atomic commit.
   const tx={
     hasDelivery:async id=>state.deliveries.has(id),
     hasOrderLine:async id=>state.lines.has(id),
     getCampaign:async id=>({id,startsAt:'2026-11-01T12:00:00Z',
       closesAt:'2026-11-15T12:00:00Z',dealerId:'dealer1'}),
     getApprovedProof:async id=>({id,status:'approved'}),
     getCampaignVariant:async()=>({enabled:true,shopifyVariantId:'gid://shopify/ProductVariant/123'}),
     getPriceSnapshot:async()=>({verified:true,unitPriceCents:2500,
       manufacturingCents:700,groupEarningsCents:500,dealerEarningsCents:100}),
     recordDelivery:async()=>{},
     insertOrderLine:async line=>state.lines.add(line.shopifyLineId),
     appendEarnings:async entry=>state.earnings.push(entry),
     markDelivery:async d=>state.deliveries.add(d.deliveryId)
   };
   return fn(tx);
 }};
 return {state,order,store};
}
const args={rawBody:body,hmacHeader:hmac,webhookSecret:secret,
 shopDomain:'missionflag.myshopify.com',deliveryId:'delivery-1',
 topic:'orders/paid',attributionSecret:secret};
test('verified paid order books exactly one earnings entry on repeat deliveries',async()=>{
 const x=fixture();
 const r=await ingestPaidOrder({...args,store:x.store,
  fetchShopifyOrder:async()=>x.order});
 assert.equal(r.lines[0].recorded,true);
 assert.equal(x.state.earnings[0].groupCents,1000);
 const second=await ingestPaidOrder({...args,store:x.store,
  fetchShopifyOrder:async()=>x.order});
 assert.equal(second.duplicate,true);assert.equal(x.state.earnings.length,1);
});
test('unverified HMAC, wrong paid status and price mutation cannot credit earnings',async()=>{
 const x=fixture();
 assert.equal((await ingestPaidOrder({...args,hmacHeader:'fake',store:x.store,
  fetchShopifyOrder:async()=>x.order})).status,401);
 x.order.displayFinancialStatus='PENDING';
 await assert.rejects(ingestPaidOrder({...args,store:x.store,
  fetchShopifyOrder:async()=>x.order}),/paid on Shopify/);
 x.order.displayFinancialStatus='PAID';
 x.order.lineItems[0].discountedTotalCents=1000;
 await assert.rejects(ingestPaidOrder({...args,store:x.store,
  fetchShopifyOrder:async()=>x.order}),/Discount changed/);
 assert.equal(x.state.earnings.length,0);
});
