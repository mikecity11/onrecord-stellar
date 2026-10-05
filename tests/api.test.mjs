import test from 'node:test';import assert from 'node:assert/strict';import handler from '../api/market.mjs';
const call=async body=>{let result,status=200;const res={setHeader(){},status(n){status=n;return this;},json(v){result=v;}};await handler({method:'POST',body},res);return {result,status};};
test('unconfigured contract is explicit and does not enable deposits',async()=>{const {result}=await call({action:'config'});assert.equal(result.network,'Stellar Testnet');assert.equal(result.contractId,null);});
test('invalid signer is rejected before blockchain operations',async()=>{const r=await call({action:'stake',address:'not-a-wallet',amount:'1'});assert.equal(r.status,400);assert.match(r.result.error,/funded Stellar testnet/);});
