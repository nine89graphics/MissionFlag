import test from 'node:test';
import assert from 'node:assert/strict';
import {beginSupporterCheckout} from '../src/storefront.js';
const shopifyConfig={shopDomain:'missionflag.myshopify.com',storefrontToken:'test-token',
  signingSecret:'not-real-secret'};
const campaign={id:'campaign-1',slug:'wildcats',status:'published',
  artworkAuthorized:true,pricesVerified:true,
  startsAt:'2026-11-01T12:00:00Z',durationDays:7};
const proof={id:'proof-1',campaignId:'campaign-1',status:'approved',
  printAssetKey:'approved/vendor-ready-file'};
const variant={enabled:true,validated:true,
  shopifyVariantId:'gid://shopify/ProductVariant/300'};
function fixture(overrides={}){
 return {findPublishedCampaign:async()=>campaign,
  findApprovedPrintProof:async()=>proof,findPublishedSize:async()=>variant,
  validateAdultParticipant:async()=>true,...overrides};
}
const params={slug:'wildcats',sizeId:'garden-12x18',quantity:2,
  participantToken:'adult-link-1',shopifyConfig,
  now:Date.parse('2026-11-02T12:00:00Z')};
test('guest checkout passes only server-trusted campaign, proof and variant',async()=>{
 let input;
 const out=await beginSupporterCheckout({...params,repository:fixture(),
  createCart:async args=>{input=args;return {checkoutUrl:'https://example.org/test'};}});
 assert.equal(out.checkoutUrl,'https://example.org/test');
 assert.equal(input.variantMapping['garden-12x18'].shopifyVariantId,variant.shopifyVariantId);
 assert.equal(input.campaign.id,campaign.id);
 assert.equal(input.quantity,2);
});
test('guest checkout rejects unapproved artwork, no variant and spoofed tokens',async()=>{
 const createCart=async()=>{throw new Error('checkout must not be called')};
 await assert.rejects(beginSupporterCheckout({...params,
   repository:fixture({findApprovedPrintProof:async()=>({...proof,printAssetKey:null})}),
   createCart}),/production artwork/);
 await assert.rejects(beginSupporterCheckout({...params,
   repository:fixture({findPublishedSize:async()=>null}),createCart}),/not ready/);
 await assert.rejects(beginSupporterCheckout({...params,
   repository:fixture({validateAdultParticipant:async()=>false}),createCart}),/not valid/);
 await assert.rejects(beginSupporterCheckout({...params,slug:'../../steal',
   repository:fixture(),createCart}),/link/);
});
