import type {SupabaseClient} from '@supabase/supabase-js';
import {APIError} from './server';
import {testnetRpc} from './testnet-rpc';
import {inspectTestnetOutcome,prepareTestnetTransfer,testnetAccount} from './testnet-transfer';
import {testnetTransferRecord,type TestnetTransferRecord} from './testnet-activity';
import {fromYoctoNear} from './wallet-balance';
export async function saveTestnetTransfer(db:SupabaseClient,record:TestnetTransferRecord){
 const clean=testnetTransferRecord.parse(record);
 const {error}=await db.from('testnet_transfers').upsert(clean,{onConflict:'hash',ignoreDuplicates:true});
 if(error)throw new APIError('Execution was verified, but shared history could not be saved. Run supabase/testnet-activity.sql, then verify again. Do not send again.',503);
 return clean;
}
/** Only on-chain public fields enter shared history; private invoice fields never do. */
export async function checkTestnetTransfer(input:{hash:string;sender:string;receiver?:string;amount?:string}):Promise<{status:'pending'|'confirmed'|'failed';reason:string;checkedAt:string;record?:TestnetTransferRecord}>{
 const {result,provider}=await testnetRpc('tx',{tx_hash:input.hash,sender_account_id:input.sender,wait_until:'FINAL'});
 if(!result)return {status:'pending' as const,reason:'Final execution is not available yet. Check again; do not resend.',checkedAt:new Date().toISOString()};
 const tx=result.transaction;
 if(tx?.hash!==input.hash||tx?.signer_id!==input.sender||tx?.actions?.length!==1||!/^\d+$/.test(tx?.actions?.[0]?.Transfer?.deposit||''))throw new APIError('This is not the expected native NEAR testnet transfer.',409);
 const receiver=testnetAccount.parse(tx.receiver_id),amount=fromYoctoNear(tx.actions[0].Transfer.deposit);
 prepareTestnetTransfer(input.sender,receiver,amount);
 let outcome;try{outcome=inspectTestnetOutcome(result,{hash:input.hash,sender:input.sender,receiver:input.receiver||receiver,amount:input.amount||amount});}catch(e){throw new APIError((e as Error).message,409);}
 const checkedAt=new Date().toISOString();if(outcome.status!=='confirmed')return {...outcome,checkedAt};
 const blockHash=result.transaction_outcome?.block_hash;if(typeof blockHash!=='string')throw new APIError('Execution block evidence is missing. Nothing was recorded as confirmed.',503);
 const block=await testnetRpc('block',{block_id:blockHash}),header=block.result?.header,ns=header?.timestamp_nanosec||header?.timestamp;
 if(header?.hash!==blockHash||!Number.isSafeInteger(header?.height)||!/^\d+$/.test(ns))throw new APIError('Execution block evidence is invalid. Nothing was recorded as confirmed.',503);
 const timestamp=Number(BigInt(ns)/1000000n);if(!Number.isSafeInteger(timestamp)||timestamp<=0||timestamp>Date.now()+60000)throw new APIError('Execution timestamp is invalid.',503);
 return {...outcome,checkedAt,record:testnetTransferRecord.parse({hash:input.hash,sender:input.sender,receiver,amount_atomic:tx.actions[0].Transfer.deposit,block_height:header.height,block_timestamp:new Date(timestamp).toISOString(),verified_at:checkedAt,provider})};
}
