import type {SupabaseClient} from '@supabase/supabase-js';
import {APIError} from './server';
/** Match the database's case-insensitive invoice key; ILIKE metacharacters are literals. */
export function literalReference(reference:string){return reference.trim().replace(/[\\%_]/g,'\\$&');}
export async function guardExistingLiveReference(db:SupabaseClient,user:string,reference:string,requestToken?:string){
 let query=db.from('live_payment_orders').select('id,state,expires_at').eq('user_id',user).ilike('invoice_reference',literalReference(reference)).not('state','in','(EXPIRED,REFUNDED)');if(requestToken)query=query.eq('input->>requestToken',requestToken);const {data,error}=await query.limit(1).maybeSingle();
 if(error)throw new APIError('Existing payment history could not be checked. Refresh before retrying.',503);
 if(!data||data.state==='QUOTED'&&Date.parse(data.expires_at)<=Date.now())return;
 throw new APIError(data.state==='SUCCESS'?'This invoice reference already has a verified paid order. Review its receipt; do not pay again.':'This invoice reference already has a saved payment. Review or recover it before starting another.',409,{existingOrderId:data.id});
}

export async function validateSeparatePayment(db:SupabaseClient,user:string,input:{repeatOf?:string;repeatConfirmed?:true;requestToken?:string;sender:string;recipient:string;destinationAsset:string;destinationChain:string;invoiceReference:string}){
 if(!input.repeatOf){if(input.repeatConfirmed)throw new APIError('Select the prior paid order before confirming a separate payment.');return;}
 const {data,error}=await db.from('live_payment_orders').select('id,state,evidence,sender,recipient,destination_asset,destination_chain,invoice_reference').eq('user_id',user).eq('id',input.repeatOf).maybeSingle();
 if(input.requestToken)throw new APIError('A new payment must be separate from the already-paid invoice link.',409);
 if(error||!data||data.state!=='SUCCESS'||data.evidence?.verified!==true||input.repeatConfirmed!==true)throw new APIError('A separately confirmed payment requires your own verified paid order.',409);
 if(data.sender!==input.sender||data.recipient!==input.recipient||data.destination_asset!==input.destinationAsset||data.destination_chain!==input.destinationChain||data.invoice_reference.trim().toLowerCase()===input.invoiceReference.trim().toLowerCase())throw new APIError('Review the same recipient and asset with a new payment reference. The old payment stays unchanged.',409);
}
