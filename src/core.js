// Mission Flag foundation: deterministic, dependency-free domain rules.
// Financial values are integer cents. No unverified pricing is configured.
export const STYLES = Object.freeze([
  'Varsity Classic','Velocity','Predator','Vortex','Gridiron / Sport Pattern',
  'Splatter','Ice Breaker','Tie-Dye Spirit','Paint Drip','Shield Pride',
  'Digital Camo','Neon Energy'
]);
export const SIZES = Object.freeze([
  { id:'garden-12x18', label:'12×18 garden', initial:true },
  { id:'house-24x36', label:'24×36 house', initial:true },
  { id:'pole-3x5', label:'3×5 pole', initial:true },
  { id:'pole-4x6', label:'4×6 pole', initial:false },
  { id:'pole-5x8', label:'5×8 pole', initial:false },
  { id:'pole-6x10', label:'6×10 pole', initial:false }
]);
const integer=(n)=>Number.isSafeInteger(n);
const nonnegative=(n)=>integer(n)&&n>=0;
export function requireMoney(n,label='amount') {
  if (!nonnegative(n)) throw new Error(label+' must be nonnegative integer cents');
  return n;
}
export function campaignWindow({startsAt,durationDays,now=Date.now()}) {
  if (![7,14].includes(durationDays)) throw new Error('Campaign length must be 7 or 14 days');
  const start=Date.parse(startsAt);
  if (!Number.isFinite(start)) throw new Error('Invalid ISO campaign start');
  const end=start+durationDays*86400000;
  const instant=typeof now==='number'?now:Date.parse(now);
  if (!Number.isFinite(instant)) throw new Error('Invalid evaluation time');
  return {startsAt:new Date(start).toISOString(),endsAt:new Date(end).toISOString(),
    status:instant<start?'scheduled':instant>=end?'closed':'active'};
}
export function canPublish({hqApproved,proofApproved,artworkAuthorized,pricesVerified,enabledSizeIds=[]}) {
  return Boolean(hqApproved&&proofApproved&&artworkAuthorized&&pricesVerified&&
    enabledSizeIds.length>0&&enabledSizeIds.every(id=>SIZES.some(s=>s.id===id)));
}
export function fundraiserLine({unitPriceCents,manufacturingCents,packingCents=0,
  platformFeeCents=0,shippingSubsidyCents=0,reserveCents=0,
  groupEarningsCents,dealerEarningsCents=0,minContributionCents=0,quantity=1}) {
  for(const [key,val] of Object.entries({unitPriceCents,manufacturingCents,packingCents,
    platformFeeCents,shippingSubsidyCents,reserveCents,groupEarningsCents,
    dealerEarningsCents,minContributionCents})) requireMoney(val,key);
  if (!integer(quantity)||quantity<1) throw new Error('Invalid quantity');
  const cost=manufacturingCents+packingCents+platformFeeCents+shippingSubsidyCents+reserveCents;
  const contributionPerUnit=unitPriceCents-cost-groupEarningsCents-dealerEarningsCents;
  if(contributionPerUnit<minContributionCents) throw new Error('Contribution floor violated');
  return Object.freeze({quantity,revenueCents:unitPriceCents*quantity,
    directCostCents:cost*quantity,groupLiabilityCents:groupEarningsCents*quantity,
    dealerLiabilityCents:dealerEarningsCents*quantity,
    contributionCents:contributionPerUnit*quantity});
}
export function wholesaleQuote({publishedListCents,quantity=1,discountCode='C',
  unitCostCents,minContributionCents=0}) {
  for(const [key,value] of Object.entries({publishedListCents,unitCostCents,minContributionCents}))
    requireMoney(value,key);
  if(!integer(quantity)||quantity<1) throw new Error('Invalid quantity');
  // C = 40% off published list. Never stack discounts or use fundraiser earnings.
  if(discountCode!=='C'&&discountCode!=='NONE') throw new Error('Unsupported discount code');
  const netUnitCents=discountCode==='C'?Math.round(publishedListCents*0.6):publishedListCents;
  if(netUnitCents-unitCostCents<minContributionCents) throw new Error('Wholesale contribution floor violated');
  return {quantity,discountCode,unitNetCents:netUnitCents,netTotalCents:netUnitCents*quantity,
    contributionCents:(netUnitCents-unitCostCents)*quantity,groupLiabilityCents:0,dealerLiabilityCents:0};
}
export function projectFundraiser({uniqueHouseholds,conversionRate,unitsPerBuyer=1,
  earningsPerFlagCents}) {
  if(!nonnegative(uniqueHouseholds)) throw new Error('Invalid unique household count');
  if(!(conversionRate>=0&&conversionRate<=1)||!Number.isFinite(conversionRate))
    throw new Error('Invalid conversion assumption');
  if(!(unitsPerBuyer>0)||!Number.isFinite(unitsPerBuyer)) throw new Error('Invalid units assumption');
  requireMoney(earningsPerFlagCents,'earningsPerFlagCents');
  const buyers=Math.round(uniqueHouseholds*conversionRate);
  const units=Math.round(buyers*unitsPerBuyer);
  return {buyers,units,estimatedGroupEarningsCents:units*earningsPerFlagCents,assumption:true};
}
// Pure reducer: persist processed event IDs and snapshots in a real transaction in the DB adapter.
// Each refund refers to the actual paid line and can never reverse more than its original units.
export function applyOrderEvent(state,event) {
  if(!event?.id||!event.orderId) throw new Error('Missing event/order ID');
  const seen=new Set(state.seen||[]);
  if(seen.has(event.id)) return state;
  const orders={...(state.orders||{})};
  const prior=orders[event.orderId];
  if(event.type==='paid') {
    if(prior) throw new Error('Order already recorded');
    if(!event.snapshot||!integer(event.snapshot.quantity)) throw new Error('Missing immutable price snapshot');
    orders[event.orderId]={snapshot:{...event.snapshot},refundedUnits:0};
  } else if(event.type==='refund') {
    if(!prior) throw new Error('Refund before paid event; retry after reconciliation');
    if(!integer(event.units)||event.units<1||prior.refundedUnits+event.units>prior.snapshot.quantity)
      throw new Error('Invalid refund units');
    orders[event.orderId]={...prior,refundedUnits:prior.refundedUnits+event.units};
  } else {throw new Error('Unknown event type');}
  seen.add(event.id);
  return {orders,seen:[...seen]};
}
export function ledgerTotals(state) {
  let groupLiabilityCents=0,dealerLiabilityCents=0,contributionCents=0;
  for(const order of Object.values(state.orders||{})) {
    const remaining=order.snapshot.quantity-order.refundedUnits;
    const q=order.snapshot.quantity;
    if(!integer(q)||q<1) throw new Error('Invalid stored quantity');
    for(const k of ['groupLiabilityCents','dealerLiabilityCents','contributionCents']) {
      if(!nonnegative(order.snapshot[k])||order.snapshot[k]%q!==0) throw new Error('Invalid stored snapshot');
    }
    groupLiabilityCents+=order.snapshot.groupLiabilityCents/q*remaining;
    dealerLiabilityCents+=order.snapshot.dealerLiabilityCents/q*remaining;
    contributionCents+=order.snapshot.contributionCents/q*remaining;
  }
  return {groupLiabilityCents,dealerLiabilityCents,contributionCents};
}
export function authorize({role,ownerId,actorId,action}) {
  if(role==='hq') return true;
  if(action==='viewCampaign') return role==='organizer'&&ownerId===actorId ||
    role==='dealer'&&ownerId===actorId;
  return false; // default deny; exact dealer and organizer scopes require verified binding.
}
