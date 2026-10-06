import { server, contractId, readAddress, sc, simulate, prepare, jsonSafe } from '../lib/chain.mjs';
import { TransactionBuilder, Networks, StrKey } from '@stellar/stellar-sdk';
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 try {
  const b=req.method==='GET'?req.query:req.body;
  if(b.action==='config') return res.json({network:'Stellar Testnet',contractId:contractId||null,resolverName:'Michael Anagor',reviewSeconds:3600,refundSeconds:604800});
  if(b.action==='list' && !b.address) b.address=readAddress;
  if(!StrKey.isValidEd25519PublicKey(b.address||'')) return res.status(400).json({error:'Connect a funded Stellar testnet wallet.'});
  if(b.action==='list') {
   const {value:config}=await simulate(b.address,'config');
   const count=Number(config[2]);
   const markets=await Promise.all(Array.from({length:Math.min(count,50)},(_,i)=>simulate(b.address,'get',[sc(count-1-i,'u32')]).then(r=>({id:count-1-i,...r.value}))));
   return res.json(jsonSafe({resolver:config[0],token:config[1],count,markets}));
  }
  if(b.action==='position') return res.json(jsonSafe((await simulate(b.address,'position',[sc(Number(b.id),'u32'),sc(b.address,'address')])).value));
  const id=sc(Number(b.id||0),'u32'); let method,args;
  if(b.action==='create') {
   if(!/^https:\/\//.test(b.source||'')) throw new Error('Use an HTTPS evidence source.');
   method='create';args=[sc(b.address,'address'),sc(b.question,'string'),sc(b.rules,'string'),sc(b.source,'string'),sc(BigInt(b.close),'u64'),sc(BigInt(b.deadline),'u64')];
  } else if(b.action==='stake') { if(!/^\d+(\.\d{1,7})?$/.test(b.amount||'')) throw new Error('Use a positive amount with at most 7 decimals.'); const [a,d='']=b.amount.split('.');const n=BigInt(a)*10000000n+BigInt(d.padEnd(7,'0'));if(n<=0n||n>100000000n) throw new Error('Stake between 0 and 10 test XLM.');method='stake';args=[id,sc(b.address,'address'),sc(b.side==='yes','bool'),sc(n,'i128')];
  } else if(b.action==='resolve') {method='resolve';args=[id,sc(Number(b.outcome),'u32'),sc(b.evidence,'string'),sc(b.reason,'string')];
  } else if(b.action==='claim') {method='claim';args=[id,sc(b.address,'address')];
  } else return res.status(400).json({error:'Unknown action.'});
  return res.json({xdr:await prepare(b.address,method,args),networkPassphrase:Networks.TESTNET});
 } catch(e) {res.status(400).json({error:e.message});}
}
