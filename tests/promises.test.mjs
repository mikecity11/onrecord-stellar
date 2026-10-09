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
