import type {SupabaseClient} from '@supabase/supabase-js';
import {randomBytes} from 'node:crypto';
import {businessInvoiceInput} from './business-invoices';
import {invoiceAsset,requestView,reconcileRequest} from './payment-request-server';
import {paymentRequestInput,publicPaymentRequest} from './payment-requests';
import {liveRpc} from './live-server';
import {toAtomic} from './amount';
import {APIError} from './server';
export async function businessInvoices(db:SupabaseClient,user:string,reconcile=false){
 const {data,error}=await db.from('business_invoices').select('*').or('issuer_id.eq.'+user+',payer_id.eq.'+user).order('created_at',{ascending:false}).limit(101);if(error)throw new APIError('Invoice inbox needs supabase/business-inbox.sql. Existing payments are unchanged.',503);
 if(!data?.length)return {invoices:[],verificationIssue:'',hasMore:false};const selected=data.slice(0,100);
 const requests=await db.from('live_payment_requests').select('*').in('id',selected.map(i=>i.id));if(requests.error)throw new APIError('Invoice details unavailable.',503);
 const byId=new Map(requests.data.map(r=>[r.id,r]));const nativeIds=requests.data.filter(r=>r.bound_order&&r.bound_route!=='BSC').map(r=>r.bound_order),bscIds=requests.data.filter(r=>r.bound_order&&r.bound_route==='BSC').map(r=>r.bound_order);
 const orders=new Map<string,any>();for(const [table,ids]of [['live_payment_orders',nativeIds],['bsc_transfer_orders',bscIds]]as const){if(!ids.length)continue;const r=await db.from(table).select('*').in('id',ids);if(r.error)throw new APIError('Invoice payment evidence unavailable.',503);for(const o of r.data)orders.set(table+':'+o.id,table==='bsc_transfer_orders'?{...o,execution_kind:'BSC_DIRECT'}:o);}
 const result=[];let checked=0,verificationIssue=false;
 for(const item of selected){const row=byId.get(item.id);if(!row)throw new APIError('Invoice details unavailable.',503);const key=(row.bound_route==='BSC'?'bsc_transfer_orders':'live_payment_orders')+':'+row.bound_order;let order=orders.get(key);if(row.bound_order&&!order)throw new APIError('Invoice payment evidence unavailable.',503);if(reconcile&&checked<3&&order?.funding_hash&&!['SUCCESS','REFUNDED','FAILED','EXPIRED'].includes(order.state)){checked++;try{await reconcileRequest(db,row);const r=await db.from(row.bound_route==='BSC'?'bsc_transfer_orders':'live_payment_orders').select('*').eq('id',row.bound_order).single();if(r.error)throw r.error;order=row.bound_route==='BSC'?{...r.data,execution_kind:'BSC_DIRECT'}:r.data;}catch{verificationIssue=true;}}result.push({id:item.id,direction:item.issuer_id===user?'issued':'received',issuerName:item.issuer_name,payerName:item.payer_name,createdAt:item.created_at,...publicPaymentRequest(row,order)});}

 return {invoices:result,hasMore:data.length>100,verificationIssue:verificationIssue?'Some payments are still awaiting provider verification. No unverified invoice was marked paid.':''};
}
export async function deliverBusinessInvoice(db:SupabaseClient,user:string,raw:unknown){const input=businessInvoiceInput.parse(raw);const source=await db.from('network_supplier_applications').select('id,owner_id,business_name,wallet,chain,status').eq('owner_id',user).eq('network','mainnet').eq('status','approved').maybeSingle();if(source.error||!source.data)throw new APIError('Register your mainnet business and complete administrator approval before issuing invoices.',409);const own=source.data;
 const asset=await invoiceAsset(input.destinationAsset,own.chain);toAtomic(input.amount,asset.decimals);const {id,publishConfirmed,...data}=paymentRequestInput.parse({id:input.id,businessName:own.business_name,invoiceReference:input.invoiceReference,recipient:own.wallet,destinationChain:own.chain,destinationAsset:input.destinationAsset,amount:input.amount,invoiceText:input.invoiceText,publishConfirmed:true});
 const row=await liveRpc(db,'afripay_deliver_invoice',{p_user:user,p_id:id,p_token:randomBytes(32).toString('hex'),p_payer:input.payerSupplierId,p_data:data,p_asset:{assetId:asset.assetId,symbol:asset.symbol,decimals:asset.decimals,blockchain:asset.blockchain}});return {id:row.id,...await requestView(db,row)};}
