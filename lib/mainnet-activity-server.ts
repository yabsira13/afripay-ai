import type {SupabaseClient} from '@supabase/supabase-js';
import {APIError} from './server';
import {validateLookupAccount} from './near-observations';
import {publicNativeTransfer,type MainnetTransfer} from './mainnet-activity';
export async function nativeActivity(db:SupabaseClient,account:string){
 validateLookupAccount(account,'mainnet');
 const {data,error}=await db.from('live_payment_orders').select('execution_kind,state,funding_hash,sender,recipient,amount_out,evidence,settled_at').eq('execution_kind','NATIVE_NEAR').eq('state','SUCCESS').or('sender.eq.'+account+',recipient.eq.'+account).order('settled_at',{ascending:false}).limit(101);
 if(error)throw new APIError('Native NEAR activity could not load. Refresh to retry; no zero balance or empty history was assumed.',503);
 const transfers=[...new Map((data||[]).map(r=>publicNativeTransfer(r,account)).filter((r):r is MainnetTransfer=>r!==null).map(r=>[r.hash,r])).values()];
 return {network:'mainnet',account,transfers:transfers.slice(0,100),hasMore:(data||[]).length>100,notice:'Latest 100 native NEAR transfers verified by AFRIPAY, across sender and receiver accounts. This is not complete wallet history. Public address lookup does not establish ownership.'};
}
/** Reconcile at most three already-submitted native hashes. Never authorize or send money. */
export async function reconcileNativeActivity(db:SupabaseClient,account:string){
 validateLookupAccount(account,'mainnet');
 const {data,error}=await db.from('live_payment_orders').select('id,user_id').eq('execution_kind','NATIVE_NEAR').eq('state','SUBMITTED').not('funding_hash','is',null).or('sender.eq.'+account+',recipient.eq.'+account).order('created_at',{ascending:false}).limit(3);
 if(error)throw new APIError('Submitted NEAR transfers could not be checked. Refresh to retry.',503);
 const {monitorOrder}=await import('./live-server');const checked=await Promise.allSettled((data||[]).map(row=>monitorOrder(db,row.user_id,row.id)));
 return {...await nativeActivity(db,account),verificationIssue:checked.some(r=>r.status==='rejected')?'Some submitted transfers could not be verified yet. No unverified transfer was counted. Refresh to retry.':''};
}
