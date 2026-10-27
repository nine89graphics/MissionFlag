import test from 'node:test';
import assert from 'node:assert/strict';
import {renderStyleBoard,renderStylePreview} from '../src/style-previews.js';
const details={schoolName:'North Wildcats',mascotName:'Wildcats',
  primaryColor:'#192B51',secondaryColor:'#EAB308'};
test('all twelve consistent garden flag concepts have numbered labels',()=>{
 const result=renderStyleBoard(details);
 assert.equal(result.length,12);
 assert.equal(new Set(result.map(x=>x.name)).size,12);
 result.forEach((style,i)=>{
  assert.equal(style.number,i+1);
  assert.match(style.svg,/viewBox="0 0 400 600"/);
  assert.match(style.svg,/CONCEPT ONLY/);
  assert.match(style.svg,/North Wildcats/);
 });
});
test('official logo remains embedded without altered sizing ratios',()=>{
 const image='data:image/png;base64,aGVsbG8=';
 const svg=renderStylePreview({...details,styleNumber:4,logoDataUri:image});
 assert.ok(svg.includes(image));
 assert.ok(svg.includes('preserveAspectRatio="xMidYMid meet"'));
});
test('logo format, unconfirmed text and XML injection are rejected/escaped',()=>{
 assert.throws(()=>renderStylePreview({...details,logoDataUri:'javascript:alert(1)',styleNumber:1}),/trusted/);
 assert.throws(()=>renderStylePreview({...details,styleNumber:13}),/Unknown/);
 assert.throws(()=>renderStylePreview({...details,schoolName:'A'.repeat(60),styleNumber:2}),/readable/);
 const svg=renderStylePreview({...details,mascotName:'A&B <C>',styleNumber:2});
 assert.ok(svg.includes('A&amp;B &lt;C&gt;'));
 assert.ok(!svg.includes('A&B <C>'));
});
