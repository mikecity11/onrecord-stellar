import deployment from '../deployment.json' with { type: 'json' };
import { rpc, TransactionBuilder, Networks, Contract, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';
export const server = new rpc.Server('https://soroban-testnet.stellar.org');
export const contractId = deployment.contractId;
export const deployments=[{contractId,feeBps:deployment.feeBps||0},...(deployment.legacyContracts||[])];
export function targetContract(id=contractId){if(!deployments.some(c=>c.contractId===id))throw Error('Unknown OnRecord contract.');return id;}
export const readAddress = deployment.resolver;
export const sc = (v,type) => nativeToScVal(v,{type});
export async function simulate(address,method,args=[],target=contractId) {
 if(!contractId) throw new Error('The Soroban contract is not configured yet.');
 targetContract(target);
 const account=await server.getAccount(address);
 const tx=new TransactionBuilder(account,{fee:'10000',networkPassphrase:Networks.TESTNET}).addOperation(new Contract(target).call(method,...args)).setTimeout(180).build();
 const sim=await server.simulateTransaction(tx);
 if(rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
 return { tx, sim, value:sim.result ? scValToNative(sim.result.retval):null };
}
export async function prepare(address,method,args,target=contractId) {const {tx,sim}=await simulate(address,method,args,target);return rpc.assembleTransaction(tx,sim).build().toXDR();}
export function jsonSafe(v) {return JSON.parse(JSON.stringify(v,(_,x)=>typeof x==='bigint'?x.toString():x));}
