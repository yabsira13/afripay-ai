import {z} from 'zod';
import {api,json,APIError} from '@/lib/server';
import {liveUser} from '@/lib/live-server';
import {testnetRpc} from '@/lib/testnet-rpc';
import {testnetInvoiceDraft,verifyTestnetInvoice} from '@/lib/testnet-invoices';
import {testnetAccount,testnetHash,inspectTestnetOutcome,prepareTestnetTransfer,testnetWalletRequest} from '@/lib/testnet-transfer';
const action=z.discriminatedUnion('action',[
 testnetInvoiceDraft.safeExtend({action:z.literal('create')}),
 z.object({action:z.literal('authorize'),id:z.uuid(),sender:testnetAccount}).strict(),
 z.object({action:z.literal('attach'),id:z.uuid(),hash:testnetHash}).strict(),
 z.object({action:z.literal('verify'),id:z.uuid()}).strict()
]);
export async function GET(request:Request){return api(request,async()=>{const {user,db}=await liveUser(request);const {data,error}=await db.from('testnet_invoices').select('*').eq('user_id',user).order('created_at',{ascending:false}).limit(100);if(error)throw new APIError('Install supabase/testnet-invoices.sql to enable saved testnet invoices.',503);return {invoices:data};});}
export async function POST(request:Request){return api(request,async()=>{
 const {user,db}=await liveUser(request),input=action.parse(await json(request));
 if(input.action==='create'){
  const {action:ignored,...fields}=input;const draft=testnetInvoiceDraft.parse(fields);
  const existing=await db.from('testnet_invoices').select('*').eq('id',draft.id).eq('user_id',user).maybeSingle();
  if(existing.error)throw new APIError('Install supabase/testnet-invoices.sql first.',503);
  if(existing.data){if(['reference','receiver','amount','description'].some(k=>existing.data[k]!==draft[k as keyof typeof draft]))throw new APIError('Invoice ID already has different details.',409);return {invoice:existing.data};}
  const {result}=await testnetRpc('query',{request_type:'view_account',account_id:draft.receiver,finality:'final'});
  if(!Number.isSafeInteger(result?.block_height))throw new APIError('Recipient block evidence unavailable.',503);
  const created=await db.from('testnet_invoices').insert({...draft,user_id:user,min_block_height:result.block_height}).select().single();
  if(created.error)throw new APIError('Invoice not saved. Use a unique reference and check the database migration.',409);
  return {invoice:created.data};
 }
 const {data:row,error}=await db.from('testnet_invoices').select('*').eq('id',input.id).eq('user_id',user).single();
 if(error||!row)throw new APIError('Testnet invoice not found.',404);
 if(input.action==='authorize'){
  const proposal=prepareTestnetTransfer(input.sender,row.receiver,row.amount);
  const {result}=await testnetRpc('query',{request_type:'view_account',account_id:input.sender,finality:'final'});
  if(!result||!/^\d+$/.test(result.amount)||!Number.isSafeInteger(result.storage_usage)||BigInt(result.amount)<BigInt(proposal.atomicAmount)+BigInt(result.storage_usage)*10n**19n+2n*10n**22n)throw new APIError('Not enough test NEAR after storage and a 0.02 test NEAR fee buffer.');
  const updated=await db.from('testnet_invoices').update({state:'AUTHORIZING',sender:input.sender}).eq('id',row.id).eq('user_id',user).eq('state','OPEN').select().maybeSingle();
  if(updated.error||!updated.data)throw new APIError('Authorization already claimed. Recover the existing transaction hash; do not pay again.',409);
  return {invoice:updated.data,walletRequest:testnetWalletRequest(proposal)};
 }
 if(input.action==='attach'){
  if(row.funding_hash===input.hash)return {invoice:row};
  const updated=await db.from('testnet_invoices').update({state:'SUBMITTED',funding_hash:input.hash}).eq('id',row.id).eq('user_id',user).eq('state','AUTHORIZING').is('funding_hash',null).select().maybeSingle();
  if(updated.error||!updated.data)throw new APIError('Hash already used or this invoice cannot accept a new hash. Check wallet activity.',409);
  return {invoice:updated.data};
 }
 if(input.action==='verify'){
  if(row.state==='PAID')return {invoice:row};
  if(!row.funding_hash||row.state!=='SUBMITTED')throw new APIError('Attach the submitted transaction hash first.',409);
  const {result,provider}=await testnetRpc('tx',{tx_hash:row.funding_hash,sender_account_id:row.sender,wait_until:'FINAL'});
  if(!result)return {invoice:row,reason:'Final execution is not available yet. Invoice remains unpaid.'};
  let height=0,timestamp='';const preliminary=inspectTestnetOutcome(result,{hash:row.funding_hash,sender:row.sender,receiver:row.receiver,amount:row.amount});
  if(preliminary.status==='confirmed'){
   const hash=result.transaction_outcome?.block_hash;if(typeof hash!=='string')throw new APIError('Transaction block evidence missing.',503);
   const block=await testnetRpc('block',{block_id:hash});height=block.result?.header?.height;timestamp=block.result?.header?.timestamp_nanosec||block.result?.header?.timestamp;
   if(block.result?.header?.hash!==hash)throw new APIError('Block evidence does not match the transaction.',503);
  }
  let outcome;try{outcome=verifyTestnetInvoice(result,row,height,timestamp);}catch(e){throw new APIError((e as Error).message,409);}
  if(outcome.status==='pending')return {invoice:row,reason:outcome.reason};
  const proof={network:'testnet',hash:row.funding_hash,sender:row.sender,receiver:row.receiver,amount:row.amount,blockHeight:height,provider,checkedAt:new Date().toISOString(),reason:outcome.reason};
  const updated=await db.from('testnet_invoices').update({state:outcome.status==='confirmed'?'PAID':'FAILED',proof,...(outcome.status==='confirmed'?{paid_at:new Date().toISOString()}:{})}).eq('id',row.id).eq('user_id',user).eq('state','SUBMITTED').eq('funding_hash',row.funding_hash).select().single();
  if(updated.error)throw new APIError('Verified result could not be saved. Refresh; do not resend.',503);
  return {invoice:updated.data,reason:outcome.reason};
 }
 throw new APIError('Unknown invoice action.');
});}
