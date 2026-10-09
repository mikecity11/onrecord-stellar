// Stellar testnet only. Never reads or prints the resolver's private key.
import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { rpc, Keypair, Address, Asset, Operation, Networks, TransactionBuilder, scValToNative, StrKey } from '@stellar/stellar-sdk';
const resolver=process.env.RESOLVER_ADDRESS;
if(!StrKey.isValidEd25519PublicKey(resolver||''))throw Error('Set RESOLVER_ADDRESS to the resolver’s public Stellar G-address.');
const server=new rpc.Server('https://soroban-testnet.stellar.org');const deployer=Keypair.random();
const funded=await fetch('https://friendbot.stellar.org?addr='+deployer.publicKey());if(!funded.ok)throw Error('Friendbot funding failed.');
async function send(op){const account=await server.getAccount(deployer.publicKey());let tx=new TransactionBuilder(account,{fee:'10000',networkPassphrase:Networks.TESTNET}).addOperation(op).setTimeout(180).build();tx=await server.prepareTransaction(tx);tx.sign(deployer);const sent=await server.sendTransaction(tx);if(sent.status==='ERROR')throw Error('Submission failed.');for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,1500));const result=await server.getTransaction(sent.hash);if(result.status==='SUCCESS')return {value:scValToNative(result.returnValue),hash:sent.hash};if(result.status==='FAILED')throw Error('Transaction failed: '+sent.hash);}throw Error('Confirmation pending: '+sent.hash);}
const previous=JSON.parse(await readFile('deployment.json','utf8'));
const wasm=await readFile('contracts/market/target/wasm32v1-none/release/promise_market.wasm');
const uploaded=await send(Operation.uploadContractWasm({wasm}));
const result=await send(Operation.createCustomContract({address:new Address(deployer.publicKey()),wasmHash:uploaded.value,salt:randomBytes(32),constructorArgs:[new Address(resolver).toScVal(),new Address(Asset.native().contractId(Networks.TESTNET)).toScVal()]}));
const legacyContracts=[{contractId:previous.contractId,feeBps:previous.feeBps||0,issuerFeeBps:previous.issuerFeeBps||0,resolverFeeBps:previous.resolverFeeBps??previous.feeBps??0},...(previous.legacyContracts||[])];
const record={network:'testnet',feeBps:100,issuerFeeBps:30,resolverFeeBps:70,feeBasis:'positive-net-profit',legacyContracts,contractId:result.value,resolver,token:Asset.native().contractId(Networks.TESTNET),uploadTransaction:uploaded.hash,deployTransaction:result.hash};await writeFile('deployment.json',JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record,null,2));
