import test from 'node:test';
import assert from 'node:assert/strict';
import {createPostgresOrderStore} from '../src/postgres-store.js';
test('database transactions commit on success and roll back on failure',async()=>{
 const queries=[];
 let released=0;
 const pool={connect:async()=>({query:async(sql,params=[])=>{
  queries.push({sql,params});
  if(sql.startsWith('SELECT'))return {rows:[]};
  if(sql.startsWith('UPDATE shopify_webhook_inbox'))return {rows:[{delivery_id:'d1'}]};
  return {rows:[]};
 },release:()=>released++})};
 const store=createPostgresOrderStore(pool);
 await store.runTransaction(async tx=>{
   assert.equal(await tx.hasDelivery('d1'),false);
   await tx.recordDelivery({deliveryId:'d1',shopDomain:'flag.myshopify.com',
     topic:'orders/paid',payload:{orderGid:'gid://shopify/Order/1'}});
   await tx.markDelivery({deliveryId:'d1',processedAt:new Date()});
 });
 assert.equal(queries.at(-1).sql,'COMMIT');assert.equal(released,1);
 await assert.rejects(store.runTransaction(async()=>{throw new Error('boom')}),/boom/);
 assert.equal(queries.at(-1).sql,'ROLLBACK');assert.equal(released,2);
});
test('SQL uses parameterized statements and immutable-price requirement',async()=>{
 const queries=[];
 const pool={connect:async()=>({query:async(sql,params=[])=>{
  queries.push({sql,params});return {rows:[]};
 },release:()=>{}})};
 const store=createPostgresOrderStore(pool);
 await store.runTransaction(async tx=>{
   await assert.rejects(tx.insertOrderLine({priceVersionId:null}),/immutable/);
   await tx.hasOrderLine("'; DROP TABLE campaigns; --");
 });
 const unsafe=queries.find(q=>q.sql.includes('shopify_line_id=$1'));
 assert.ok(unsafe);assert.equal(unsafe.params[0],"'; DROP TABLE campaigns; --");
});
