import {z} from 'zod';
import {APIError} from './server';
import {fromYoctoNear} from './wallet-balance';
export const networkSchema=z.enum(['mainnet','testnet']);
export type NearNetwork=z.infer<typeof networkSchema>;
export const lookupAccount=z.string().min(2).max(64).regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/);
export const lookupHash=z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,64}$/);
const endpoints={mainnet:['https://free.rpc.fastnear.com','https://near.drpc.org'],testnet:['https://test.rpc.fastnear.com','https://near-testnet.drpc.org']};
export function validateLookupAccount(account:string,network:NearNetwork){lookupAccount.parse(account);if(network==='mainnet'&&account.endsWith('.testnet'))throw new APIError('Choose testnet for a .testnet account.');if(network==='testnet'&&!account.endsWith('.testnet')&&!/^[a-f0-9]{64}$/.test(account))throw new APIError('Use a .testnet account or implicit testnet account with this network.');}
async function rpc(network:NearNetwork,method:'query'|'EXPERIMENTAL_tx_status',params:unknown){
 for(const provider of endpoints[network]){try{const response=await fetch(provider,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:'afripay-read-only',method,params}),signal:AbortSignal.timeout(8000),cache:'no-store'});if(!response.ok)continue;const body=await response.json();const cause=body.error?.cause?.name;if(cause==='UNKNOWN_ACCOUNT')throw new APIError('Account was not found on the selected network.',404);if(cause==='UNKNOWN_TRANSACTION'||cause==='TIMEOUT_ERROR')return {result:null,provider};if(body.result)return {result:body.result,provider};}catch(error){if(error instanceof APIError)throw error;}}
 throw new APIError('NEAR provider is unavailable. No simulated data was substituted.',503);
}
const unsigned=z.string().regex(/^\d{1,80}$/);
export async function observeWallet(accountId:string,network:NearNetwork){
 validateLookupAccount(accountId,network);const {result,provider}=await rpc(network,'query',{request_type:'view_account',account_id:accountId,finality:'final'});
 const account=z.object({amount:unsigned,locked:unsigned,storage_usage:z.number().int().nonnegative(),block_height:z.number().int().nonnegative(),block_hash:z.string().min(1)}).safeParse(result);
 if(!account.success)throw new APIError('Account evidence was incomplete. Please retry.',502);
 return {mode:'live',readOnly:true,network,accountId,balance:fromYoctoNear(account.data.amount),locked:fromYoctoNear(account.data.locked),asset:'NEAR',blockHeight:account.data.block_height,blockHash:account.data.block_hash,storageBytes:account.data.storage_usage,provider,checkedAt:new Date().toISOString(),evidence:[{source:'observation',reason:'Account state was retrieved at finality from the selected NEAR network.'},{source:'unknown',reason:'No external scam intelligence or historical movement analysis was performed. Account activity alone does not establish safety or maliciousness.'}]};
}
const success=(value:unknown)=>!!value&&typeof value==='object'&&('SuccessValue'in value||'SuccessReceiptId'in value);
const failure=(value:unknown)=>!!value&&typeof value==='object'&&'Failure'in value;
export function inspectLookupTransaction(raw:unknown,hash:string,sender:string){
 const data=raw as Record<string,any>;
 if(!data||data.transaction?.hash!==hash||data.transaction?.signer_id!==sender)throw new APIError('Provider evidence does not match the requested hash and sender.',409);
 const tx=data.transaction;if(!Array.isArray(tx.actions)||!lookupAccount.safeParse(tx.receiver_id).success)throw new APIError('Transaction evidence is incomplete.',502);
 const receipts=Array.isArray(data.receipts_outcome)?data.receipts_outcome:[];
 let status:'pending'|'confirmed'|'failed'='pending';
 if(data.final_execution_status==='FINAL'){
  if(failure(data.status)||receipts.some((r:any)=>failure(r.outcome?.status)))status='failed';
  else if(success(data.status)&&success(data.transaction_outcome?.outcome?.status)&&receipts.length>0&&receipts.every((r:any)=>success(r.outcome?.status)))status='confirmed';
 }
 let native=0n;const actions:string[]=[];
 for(const action of tx.actions){if(!action||typeof action!=='object')throw new APIError('Unrecognized transaction action.',502);const kinds=Object.keys(action);actions.push(...kinds);if(action.Transfer){const value=unsigned.safeParse(action.Transfer.deposit);if(!value.success)throw new APIError('Transfer amount could not be verified.',502);native+=BigInt(value.data);}}
 return {hash,sender,recipient:tx.receiver_id,status,actions,nativeTransferAmount:fromYoctoNear(native.toString()),asset:'NEAR',finalExecution:data.final_execution_status||'UNKNOWN',blockHash:typeof data.transaction_outcome?.block_hash==='string'?data.transaction_outcome.block_hash:null,notice:status==='confirmed'?'Final successful execution was observed. This does not establish that the recipient or invoice is legitimate.':status==='failed'?'Final execution includes a failure. Review the chain record before retrying.':'Complete final execution evidence is not available yet. Native transfer amount describes Transfer actions only; token transfers inside contract calls are not decoded.'};
}
export async function observeTransaction(hash:string,sender:string,network:NearNetwork){
 lookupHash.parse(hash);validateLookupAccount(sender,network);const {result,provider}=await rpc(network,'EXPERIMENTAL_tx_status',{tx_hash:hash,sender_account_id:sender,wait_until:'FINAL'});
 if(!result)return {mode:'live',readOnly:true,network,hash,sender,status:'unknown',provider,checkedAt:new Date().toISOString(),notice:'Transaction not found or final execution is unavailable. Check the sender, hash and network. No success is assumed.'};
 return {mode:'live',readOnly:true,network,...inspectLookupTransaction(result,hash,sender),provider,checkedAt:new Date().toISOString()};
}
