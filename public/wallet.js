import { requestAccess, signTransaction, getNetworkDetails } from '@stellar/freighter-api';
import { rpc, TransactionBuilder, Networks } from '@stellar/stellar-sdk';
const server = new rpc.Server('https://soroban-testnet.stellar.org');
window.stellarWallet = { requestAccess, getNetworkDetails, async submit(xdr,address){
 const signed=await signTransaction(xdr,{networkPassphrase:Networks.TESTNET,address});if(signed.error)throw Error(signed.error.message||'Wallet declined signing.');
 const tx=TransactionBuilder.fromXDR(signed.signedTxXdr,Networks.TESTNET);const sent=await server.sendTransaction(tx);
 if(sent.status==='ERROR')throw Error('Stellar rejected this transaction.');if(sent.status==='TRY_AGAIN_LATER')throw Error('Network busy. Refresh before retrying.');
 for(let i=0;i<25;i++){await new Promise(r=>setTimeout(r,1500));const result=await server.getTransaction(sent.hash);if(result.status==='SUCCESS')return sent.hash;if(result.status==='FAILED')throw Error('Transaction failed on Stellar.');}
 throw Error('Confirmation is pending. Refresh the market before trying again. Transaction: '+sent.hash);
}};
