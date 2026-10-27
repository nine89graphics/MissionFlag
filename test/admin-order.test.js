import test from 'node:test';
import assert from 'node:assert/strict';
import {parseUsdCents,normalizeShopifyAdminOrder,
  createShopifyAdminOrderFetcher} from '../src/admin-order.js';

const usd=amount=>({amount,currencyCode:'USD'});
const order={id:'gid://shopify/Order/100',createdAt:'2026-11-10T12:00:00Z',
  displayFinancialStatus:'PAID',lineItems:{pageInfo:{hasNextPage:false},
  edges:[{node:{id:'gid://shopify/LineItem/200',quantity:2,
  variant:{id:'gid://shopify/ProductVariant/300'},customAttributes:[],
  originalTotalSet:{shopMoney:usd('50.00')},
  discountAllocations:[{allocatedAmountSet:{shopMoney:usd('10.00')}}]}}]}};
test('money parser preserves exact cents and rejects unsafe currency or precision',()=>{
 assert.equal(parseUsdCents(usd('12.34')),1234);
 assert.equal(parseUsdCents(usd('0.5')),50);
 assert.throws(()=>parseUsdCents(usd('10.003')));
 assert.throws(()=>parseUsdCents({amount:'10.00',currencyCode:'CAD'}));
});
test('normalization subtracts allocated order discounts, not just line-level discount',()=>{
 const value=normalizeShopifyAdminOrder(order);
 assert.equal(value.lineItems[0].discountedTotalCents,4000);
 assert.equal(value.lineItems[0].quantity,2);
 assert.throws(()=>normalizeShopifyAdminOrder({...order,
   lineItems:{...order.lineItems,pageInfo:{hasNextPage:true}}}),/Incomplete/);
});
test('Admin fetch binds shop and validates GraphQL identity',async()=>{
 let observed;
 const fetchImpl=async(url,init)=>{
  observed={url,init};
  return {ok:true,json:async()=>({data:{order}})};
 };
 const fn=createShopifyAdminOrderFetcher({shopDomain:'missionflag.myshopify.com',
  accessToken:'test-only',fetchImpl});
 const value=await fn(order.id,'missionflag.myshopify.com');
 assert.equal(value.id,order.id);
 assert.match(observed.url,/admin\/api\/2026-10/);
 assert.equal(JSON.parse(observed.init.body).variables.id,order.id);
 await assert.rejects(fn(order.id,'other.myshopify.com'),/identity/);
});
