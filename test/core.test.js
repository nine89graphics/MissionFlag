import test from 'node:test';
import assert from 'node:assert/strict';
import {STYLES,SIZES,campaignWindow,canPublish,fundraiserLine,wholesaleQuote,
  projectFundraiser,applyOrderEvent,ledgerTotals,authorize} from '../src/core.js';
test('twelve unique signature styles and six sized catalog, three initial',()=>{
  assert.equal(STYLES.length,12);assert.equal(new Set(STYLES).size,12);
  assert.equal(SIZES.length,6);assert.equal(SIZES.filter(s=>s.initial).length,3);
});
test('campaign 7/14 day boundaries use explicit UTC instants',()=>{
  const args={startsAt:'2026-11-01T15:00:00-05:00',durationDays:7};
  assert.equal(campaignWindow({...args,now:'2026-11-01T19:59:59Z'}).status,'scheduled');
  assert.equal(campaignWindow({...args,now:'2026-11-01T20:00:00Z'}).status,'active');
  assert.equal(campaignWindow({...args,now:'2026-11-08T20:00:00Z'}).status,'closed');
  assert.equal(campaignWindow({...args,durationDays:14}).status,'scheduled');
  assert.throws(()=>campaignWindow({...args,durationDays:5}));
});
test('publication requires reviewed proof and verified pricing',()=>{
  const params={hqApproved:true,proofApproved:true,artworkAuthorized:true,
    pricesVerified:true,enabledSizeIds:['garden-12x18']};
  assert.equal(canPublish(params),true);
  assert.equal(canPublish({...params,proofApproved:false}),false);
  assert.equal(canPublish({...params,enabledSizeIds:['fake']}),false);
});
test('fundraiser snapshots preserve contribution floors and liabilities',()=>{
  const x=fundraiserLine({unitPriceCents:2500,manufacturingCents:700,
    platformFeeCents:100,groupEarningsCents:500,dealerEarningsCents:200,
    reserveCents:100,minContributionCents:500,quantity:2});
  assert.equal(x.groupLiabilityCents,1000);assert.equal(x.dealerLiabilityCents,400);
  assert.equal(x.contributionCents,1800);
  assert.throws(()=>fundraiserLine({unitPriceCents:1000,manufacturingCents:700,
    groupEarningsCents:500}));
});
test('C wholesale is 40 percent off published list, not a stacked discount',()=>{
  const x=wholesaleQuote({publishedListCents:2000,unitCostCents:600,
    minContributionCents:200,quantity:3});
  assert.equal(x.unitNetCents,1200);assert.equal(x.netTotalCents,3600);
  assert.equal(x.groupLiabilityCents,0);
  assert.throws(()=>wholesaleQuote({publishedListCents:1000,unitCostCents:700,
    minContributionCents:100}));
});
test('group estimates identify assumptions not promises',()=>{
  const x=projectFundraiser({uniqueHouseholds:1000,conversionRate:0.05,
    earningsPerFlagCents:500});
  assert.equal(x.buyers,50);assert.equal(x.estimatedGroupEarningsCents,25000);
  assert.equal(x.assumption,true);
});
test('paid events deduplicate and refunds reverse only remaining liability',()=>{
  const snapshot=fundraiserLine({unitPriceCents:2500,manufacturingCents:700,
    groupEarningsCents:500,quantity:2});
  const paid={id:'webhook-a',orderId:'shopify-1',type:'paid',snapshot};
  const one=applyOrderEvent({orders:{},seen:[]},paid);
  assert.strictEqual(applyOrderEvent(one,paid),one);
  const two=applyOrderEvent(one,{id:'webhook-b',orderId:'shopify-1',type:'refund',units:1});
  assert.equal(ledgerTotals(two).groupLiabilityCents,500);
  assert.throws(()=>applyOrderEvent(two,{id:'webhook-c',orderId:'shopify-1',type:'refund',units:2}));
  assert.throws(()=>applyOrderEvent(two,{id:'webhook-d',orderId:'shopify-1',type:'paid',snapshot}));
});
test('role access is default-deny across organizations',()=>{
  assert.equal(authorize({role:'hq',action:'admin'}),true);
  assert.equal(authorize({role:'organizer',ownerId:'school-a',actorId:'school-b',action:'viewCampaign'}),false);
  assert.equal(authorize({role:'dealer',ownerId:'dealer-a',actorId:'dealer-a',action:'pricingEdit'}),false);
});
