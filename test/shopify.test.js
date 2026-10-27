import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyShopifyWebhook,signedLineAttributes,
  verifyLineAttribution,createFundraiserCheckout } from '../src/shopify.js';

const secret='test-secret-do-not-use-live';
const base={campaignId:'campaign-1',proofId:'proof-v3',sizeId:'garden-12x18',
  participantToken:'adult_team_1',variantId:'gid://shopify/ProductVariant/123456',
  quantity:1,closesAt:Date.parse('2026-11-12T12:00:00Z')};
test('Shopify raw-byte HMAC accepts valid deliveries, rejects altered bodies',()=>{
  const body=Buffer.from('{"id":123}');
  const hmac=createHmac('sha256',secret).update(body).digest('base64');
  assert.equal(verifyShopifyWebhook({rawBody:body,hmacHeader:hmac,secret}),true);
  assert.equal(verifyShopifyWebhook({rawBody:Buffer.from('{"id":124}'),hmacHeader:hmac,secret}),false);
  assert.equal(verifyShopifyWebhook({rawBody:body,hmacHeader:'invalid',secret}),false);
});
test('signed line attribution survives late webhook, blocks tampering and late purchases',()=>{
  const attributes=signedLineAttributes(base,secret);
  const attrs=verifyLineAttribution(attributes,secret,{orderCreatedAt:'2026-11-12T11:59:59Z'});
  assert.equal(attrs.campaignId,'campaign-1');
  assert.equal(verifyLineAttribution(attributes,secret,{orderCreatedAt:'2026-11-12T12:00:00Z'}),null);
  assert.equal(verifyLineAttribution(attributes.map(x=>x.key==='_mf_campaign'?{...x,value:'other'}:x),secret,{orderCreatedAt:'2026-11-10T12:00:00Z'}),null);
  assert.equal(verifyLineAttribution([...attributes,attributes[0]],secret,{orderCreatedAt:'2026-11-10T12:00:00Z'}),null);
  assert.throws(()=>signedLineAttributes({...base,participantToken:'<script>'},secret));
});
test('active approved campaign constructs a Shopify guest cart, never chooses a customer-provided variant',async()=>{
  let request;
  const fetchImpl=async (url,options)=>{
    request={url,...options};
    return {ok:true,json:async()=>({data:{cartCreate:{cart:{
      id:'gid://shopify/Cart/123',checkoutUrl:'https://checkout.shopify.com/example'
    },userErrors:[]}}})};
  };
  const campaign={id:'campaign-1',status:'published',artworkAuthorized:true,
    pricesVerified:true,startsAt:'2026-11-05T12:00:00Z',durationDays:7};
  const proof={id:'proof-v3',status:'approved',campaignId:'campaign-1'};
  const variantMapping={'garden-12x18':{enabled:true,validated:true,
    shopifyVariantId:base.variantId}};
  const args={shopDomain:'missionflag.myshopify.com',storefrontToken:'test-token',
    campaign,proof,variantMapping,sizeId:'garden-12x18',participantToken:'adult_team_1',
    signingSecret:secret,now:Date.parse('2026-11-06T12:00:00Z'),fetchImpl};
  const out=await createFundraiserCheckout(args);
  assert.match(out.checkoutUrl,/https:/);
  assert.match(request.url,/missionflag.myshopify.com/);
  const line=JSON.parse(request.body).variables.input.lines[0];
  assert.equal(line.merchandiseId,base.variantId);
  assert.equal(verifyLineAttribution(line.attributes,secret,
    {orderCreatedAt:'2026-11-06T12:00:00Z'}).campaignId,'campaign-1');
  await assert.rejects(createFundraiserCheckout({...args,now:Date.parse('2026-11-12T12:00:00Z')}),/not accepting/);
  await assert.rejects(createFundraiserCheckout({...args,proof:{...proof,status:'draft'}}),/not approved/);
  await assert.rejects(createFundraiserCheckout({...args,variantMapping:{}}),/not validated/);
  await assert.rejects(createFundraiserCheckout({...args,shopDomain:'evil.com'}),/configuration/);
});
