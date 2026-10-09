import test from 'node:test';
import assert from 'node:assert/strict';
import {encodePromise,parsePromise,promiseRecord} from '../public/promises.js';
test('public promise metadata preserves exact criteria and legacy markets remain readable',()=>{
 const input={category:'Infrastructure',organisation:'Road authority',place:'Bridge A',criteria:'Open to ordinary traffic by the deadline.\nRequire official operational evidence.'};
 assert.deepEqual(parsePromise(encodePromise(input)),input);
 assert.equal(parsePromise('Original crypto criteria').criteria,'Original crypto criteria');
 assert.throws(()=>encodePromise({...input,criteria:'Complete [duration] before posting.'}),/placeholder/);
 assert.throws(()=>encodePromise({...input,criteria:'x'.repeat(2000)}),/2,000/);
});
test('receipt distinguishes unresolved state from a submitted verdict and retains source',()=>{
 const m={id:4,question:'Will the road reopen?',rules:'Open to traffic',source:'https://example.org',close:100,deadline:200,outcome:0,claim_at:0,evidence:'',reason:''};
 const pending=promiseRecord(m,'contract','resolver');
 assert.equal(pending.outcome,'Pending');assert.equal(pending.claimsAvailable,null);
 const resolved=promiseRecord({...m,outcome:2,claim_at:400,evidence:'Official notice',reason:'Still closed'},'contract','resolver');
 assert.equal(resolved.outcome,'No');assert.equal(resolved.source,m.source);assert.equal(resolved.evidence,'Official notice');
});

import {encodeMarket,filterMarkets,displayCategory} from '../public/promises.js';
test('user-listed markets retain both outcomes, cancellation rules and issuer in receipt',()=>{
 const input={category:'Sports',yes:'Team A wins after normal time and stoppage time.',no:'Team A loses or draws after normal time and stoppage time.',unclear:'Refund if the match is cancelled or cannot be completed.',context:'Use the organiser’s official final result.'};
 const rules=encodeMarket(input),parsed=parsePromise(rules);
 for(const key of Object.keys(input))assert.equal(parsed[key],input[key]);
 const r=promiseRecord({id:2,creator:'issuer-wallet',question:'Will Team A win?',rules,source:'https://example.org',close:100,deadline:200,outcome:0,claim_at:0,evidence:'',reason:''},'contract','resolver');
 assert.equal(r.issuer,'issuer-wallet');assert.equal(r.resolver,'resolver');assert.equal(r.no,input.no);
 assert.throws(()=>encodeMarket({...input,no:''}),/No rules/);
 assert.throws(()=>encodeMarket({...input,context:'界'.repeat(600)}),/2,000 bytes/);
});
test('market discovery combines category, search, status and pool sorting without mutating input',()=>{
 const now=Math.floor(Date.now()/1000),rules=encodeMarket({category:'Sports',yes:'The team wins the specified match.',no:'The team loses or draws the specified match.',unclear:'The match is cancelled or evidence is unavailable.'});
 const a={id:1,question:'Will Nigeria win the match?',creator:'wallet-a',rules,close:now+100,deadline:now+200,outcome:0,claim_at:0,yes:'10000000',no:'0'};
 const b={...a,id:2,question:'Will Team B win?',creator:'wallet-b',yes:'20000000'};
 const c={...a,id:3,outcome:1,claim_at:now-10};const rows=[a,b,c];
 assert.deepEqual(filterMarkets(rows,{category:'Sports',query:'Nigeria',state:'open'}).map(x=>x.id),[1]);
 assert.deepEqual(filterMarkets(rows,{state:'open',sort:'pooled'}).map(x=>x.id),[2,1]);
 assert.deepEqual(filterMarkets(rows,{state:'resolved'}).map(x=>x.id),[3]);assert.deepEqual(rows.map(x=>x.id),[1,2,3]);
 assert.equal(displayCategory({...a,rules:'Legacy criteria'}),'Other');
});
