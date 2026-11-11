import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {verifyQuoteSignature,quoteHash,type QuoteResponse} from '@defuse-protocol/one-click-sdk-typescript';
import {APIError,oneClick} from './server';
import {serverAuthSettings,runtimeSetting} from './server-settings';
import {liveInput,makeLiveRequest,supportedToken,validateLiveQuote,settlementEvidence,verifyNativeDeposit,walletFundingRequest,nativeAsset,type LiveInput} from './live-payments';
import {nativeReview,nativeWalletRequest,nativeExecution} from './native-mainnet';
import {directNearAsset,normalizeToken} from './asset-catalog';
import {analyzeInvoice,score} from './security';
import {nearRpc} from './near-observations';
export function liveEnabled(){return runtimeSetting('LIVE_PAYMENTS_ENABLED')==='true'&&!!runtimeSetting('SUPABASE_SERVICE_ROLE_KEY')&&!!serverAuthSettings().settings;}
export async function liveUser(request:Request){
 const settings=serverAuthSettings().settings,token=request.headers.get('authorization')?.match(/^Bearer (\S+)$/)?.[1];
 if(!settings||!token)throw new APIError('Sign in before creating or reviewing real payments.',401);
 const session=createClient(settings.url,settings.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data,error}=await session.auth.getUser(token);if(error||!data.user)throw new APIError('Sign in again. Your session could not be verified.',401);
 const key=runtimeSetting('SUPABASE_SERVICE_ROLE_KEY');if(!key)throw new APIError('Live payment storage is not configured. No funds were sent.',503);
 return {user:data.user.id,db:createClient(settings.url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})};
}
export function requireLive(){if(!liveEnabled())throw new APIError('Real payments are disabled until live storage and operator settings are configured.',503);}
export async function liveRpc(db:SupabaseClient,name:string,args:Record<string,unknown>){const {data,error}=await db.rpc(name,args);if(error)throw new APIError('Payment database rejected the step: '+error.message,409);return data;}
export async function readOrder(db:SupabaseClient,user:string,id:string){const {data,error}=await db.from('live_payment_orders').select('*').eq('id',id).eq('user_id',user).single();if(error||!data)throw new APIError('Live payment not found or database migration missing.',404);return data;}
export function signed(raw:unknown){if(!verifyQuoteSignature(raw as QuoteResponse))throw new APIError('1Click quote signature verification failed. Do not fund this quote.',502);}
export async function liveTokens(){return supportedToken.array().parse(await oneClick('/tokens')).map(normalizeToken);}
export async function preflightBalance(sender:string,amount:string){const {result}=await nearRpc('mainnet','query',{request_type:'view_account',account_id:sender,finality:'final'});if(!result||!/^\d+$/.test(result.amount)||!Number.isSafeInteger(result.storage_usage))throw new APIError('Spendable balance evidence unavailable.',503);const reserve=BigInt(result.storage_usage)*10n**19n+2n*10n**22n;if(BigInt(result.amount)<BigInt(amount)+reserve)throw new APIError('Insufficient native NEAR after storage reserve and a 0.02 NEAR fee buffer. No payment sent.');}
async function targetPreflight(input:LiveInput,tokens:Awaited<ReturnType<typeof liveTokens>>){if(input.destinationChain!=='near')return;const target=tokens.find(t=>t.assetId===input.destinationAsset)!;await nearRpc('mainnet','query',{request_type:'view_account',account_id:input.recipient,finality:'final'});if(target.contractAddress&&target.assetId!==nativeAsset){const {result}=await nearRpc('mainnet','query',{request_type:'call_function',account_id:target.contractAddress,method_name:'storage_balance_of',args_base64:Buffer.from(JSON.stringify({account_id:input.recipient})).toString('base64'),finality:'final'});let storage;try{storage=JSON.parse(Buffer.from(result.result).toString());}catch{}if(!storage?.total||BigInt(storage.total)<=0n)throw new APIError('The receiving account is not registered for '+target.symbol+' on NEAR. Choose native NEAR instead, or ask the receiver to register this token in their wallet. Nothing was sent.');}}
export async function reserveQuote(db:SupabaseClient,user:string,raw:unknown){
 requireLive();const input=liveInput.parse(raw);const existing=await db.from('live_payment_orders').select('*').eq('id',input.requestId).eq('user_id',user).maybeSingle();if(existing.error)throw new APIError('Install supabase/live-payments.sql before using real payments.',503);if(existing.data){if(JSON.stringify(existing.data.input)!==JSON.stringify(input)){
 // JSONB field order is not stable. Compare keys instead.
 if(Object.keys(input).some(k=>existing.data.input[k]!==input[k as keyof LiveInput]))throw new APIError('Approval ID was already used with different details.',409);
 }return existing.data;}
 if(input.requestToken){const {bindRequest}=await import('./payment-request-server');await bindRequest(db,input);}
 if(input.destinationAsset===directNearAsset){
  const {result}=await nearRpc('mainnet','query',{request_type:'view_account',account_id:input.recipient,finality:'final'});const review=nativeReview(input,result?.block_height);await preflightBalance(input.sender,review.quote.amountIn);
  const checks=analyzeInvoice({id:input.requestId,number:input.invoiceReference,supplier:'Native NEAR recipient',amount:input.amount,currency:'NEAR',wallet:input.recipient,chain:'near',due:'',status:'Ready to pay',verified:true,text:input.invoiceText,createdAt:new Date().toISOString()},[],[]);if(checks.blocked)throw new APIError('Security Shield blocked this transfer.',409);
  return liveRpc(db,'afripay_native_reserve',{p_user:user,p_id:input.requestId,p_input:input,p_quote:review,p_risk:checks,p_expires:review.expiresAt});
 }
 const tokens=await liveTokens();const {request,target}=makeLiveRequest(input,tokens);await targetPreflight(input,tokens);
 const rawQuote=await oneClick('/quote',request);signed(rawQuote);const quote={...validateLiveQuote(rawQuote,request),assetMetadata:{assetId:target.assetId,symbol:target.symbol,decimals:target.decimals,blockchain:target.blockchain}};await preflightBalance(input.sender,quote.quote.amountIn);
 const checks=analyzeInvoice({id:input.requestId,number:input.invoiceReference,supplier:'Manual live recipient',amount:input.amount,currency:tokens.find(t=>t.assetId===input.destinationAsset)!.symbol,wallet:input.recipient,chain:input.destinationChain,due:'',status:'Ready to pay',verified:true,text:input.invoiceText,createdAt:new Date().toISOString()},[],[]);
 const recent=await db.from('live_payment_orders').select('id',{count:'exact',head:true}).eq('user_id',user).gte('created_at',new Date(Date.now()-600000).toISOString());if(recent.error)throw new APIError('Recent payment evidence is unavailable. Nothing sent.',503);
 const risk=score([...checks.evidence,{code:'new_live_recipient',source:'heuristic',reason:'First-version mainnet funding and a manually entered recipient require human review.',points:30},{code:'no_feed',source:'unknown',reason:'No external malicious-address feed or full on-chain history analysis is configured.',points:0},...((recent.count||0)>=3?[{code:'live_frequency',source:'heuristic' as const,reason:'Three or more real payment requests in ten minutes. Manually review frequency.',points:25}]:[])]);
 if(risk.blocked)throw new APIError('Critical risk: '+risk.evidence.filter(e=>e.points>0).map(e=>e.reason).join(' '),409);
 return liveRpc(db,'afripay_live_reserve',{p_user:user,p_id:input.requestId,p_input:input,p_quote:quote,p_risk:risk,p_expires:quote.expiresAt});
}
export async function commitOrder(db:SupabaseClient,user:string,id:string){
 requireLive();if((await readOrder(db,user,id)).execution_kind==='NATIVE_NEAR')throw new APIError('Native NEAR transfers do not use exchange quotes. Review and authorize the exact transfer.',409);const claim=await liveRpc(db,'afripay_live_claim',{p_user:user,p_id:id,p_step:'commit'});if(!claim.fresh)return claim.order;
 try{const old=claim.order;const expected={...old.dry_quote.quoteRequest,dry:false};const raw=await oneClick('/quote',expected);signed(raw);const quote=validateLiveQuote(raw,expected,Date.now(),true);await preflightBalance(old.sender,quote.quote.amountIn);return await liveRpc(db,'afripay_live_commit',{p_user:user,p_id:id,p_quote:quote,p_expires:quote.expiresAt});}
 catch(error){await liveRpc(db,'afripay_live_observe',{p_user:user,p_id:id,p_state:'NEEDS_RECONCILIATION',p_evidence:{reason:'Commit response unavailable or rejected. No wallet authorization was issued. Do not create a second payment until reviewed.'}}).catch(()=>{});throw error;}
}
export async function authorizeOrder(db:SupabaseClient,user:string,id:string){
 requireLive();const current=await readOrder(db,user,id);if(current.execution_kind==='NATIVE_NEAR'){await preflightBalance(current.sender,current.max_input);const order=await liveRpc(db,'afripay_native_claim',{p_user:user,p_id:id});return {order,walletRequest:nativeWalletRequest(order)};}if(!current.committed_quote)throw new APIError('A committed quote is required.',409);signed(current.committed_quote);validateLiveQuote(current.committed_quote,{...current.dry_quote.quoteRequest,dry:false},Date.now(),true);await preflightBalance(current.sender,current.committed_quote.quote.amountIn);
 const claim=await liveRpc(db,'afripay_live_claim',{p_user:user,p_id:id,p_step:'authorize'});if(!claim.fresh)throw new APIError('Wallet authorization was already claimed. Check wallet activity and attach its hash; do not resend.',409);
 return {order:claim.order,walletRequest:walletFundingRequest(claim.order)};
}
export async function attachFunding(db:SupabaseClient,user:string,id:string,hash:string){const order=await readOrder(db,user,id);if(!order.committed_quote)throw new APIError('No committed quote.',409);const {result}=await nearRpc('mainnet','EXPERIMENTAL_tx_status',{tx_hash:hash,sender_account_id:order.sender,wait_until:'FINAL'});if(result)verifyNativeDeposit(result,hash,order.sender,order.execution_kind==='NATIVE_NEAR'?order.recipient:order.deposit_address,order.committed_quote.quote.amountIn);return liveRpc(db,'afripay_live_attach',{p_user:user,p_id:id,p_hash:hash});}
export async function monitorOrder(db:SupabaseClient,user:string,id:string){
 const order=await readOrder(db,user,id);if(!order.committed_quote||!order.funding_hash||order.state==='SUCCESS'||order.state==='REFUNDED')return order;
 if(order.execution_kind==='NATIVE_NEAR'){
  const {result,provider}=await nearRpc('mainnet','EXPERIMENTAL_tx_status',{tx_hash:order.funding_hash,sender_account_id:order.sender,wait_until:'FINAL'});if(!result||result.final_execution_status!=='FINAL')return order;
  const block=await nearRpc('mainnet','block',{block_id:result.transaction_outcome?.block_hash});if(!nativeExecution(result,order,block.result?.header))return order;
  return liveRpc(db,'afripay_live_observe',{p_user:user,p_id:id,p_state:'SUCCESS',p_evidence:{verified:true,fundingFinal:true,source:'Final successful native NEAR mainnet execution',direct:{hash:order.funding_hash,amountIn:order.max_input,amountOut:order.amount_out,blockHeight:block.result.header.height},provider,checkedAt:new Date().toISOString()}});
 }
 signed(order.committed_quote);
 const {result}=await nearRpc('mainnet','EXPERIMENTAL_tx_status',{tx_hash:order.funding_hash,sender_account_id:order.sender,wait_until:'FINAL'});
 if(!result||!verifyNativeDeposit(result,order.funding_hash,order.sender,order.execution_kind==='NATIVE_NEAR'?order.recipient:order.deposit_address,order.committed_quote.quote.amountIn))return order;
 const status=await oneClick('/status?'+new URLSearchParams({depositAddress:order.deposit_address}));signed(status.quoteResponse);
 if(status.correlationId!==order.committed_quote.correlationId||quoteHash(status.quoteResponse as QuoteResponse)!==quoteHash(order.committed_quote as QuoteResponse))throw new APIError('Status quote does not match the saved committed payment.',409);
 const evidence=settlementEvidence(status,order);
 // Refunds need evidence tied to the same origin transfer, not simply a label.
 if(evidence.state==='REFUNDED'&&(!status.swapDetails?.originChainTxHashes?.some((t:any)=>t.hash===order.funding_hash)||!/^\d+$/.test(status.swapDetails?.refundedAmount)||BigInt(status.swapDetails.refundedAmount)<=0n))throw new APIError('Refund not yet verified. Continue monitoring.',409);
 return liveRpc(db,'afripay_live_observe',{p_user:user,p_id:id,p_state:evidence.state,p_evidence:{verified:evidence.settled,fundingFinal:true,source:'Official 1Click status bound to signed quote and verified native NEAR funding',providerStatus:status,checkedAt:new Date().toISOString()}});
}

/** Stable cutoff and deterministic pagination. Never export another user's rows or silently truncate. */
export async function allLiveOrders(db:SupabaseClient,user:string){const cutoff=new Date().toISOString(),rows:any[]=[];for(let offset=0;offset<=10000;offset+=500){const {data,error}=await db.from('live_payment_orders').select('*').eq('user_id',user).lte('created_at',cutoff).order('created_at',{ascending:true}).order('id',{ascending:true}).range(offset,offset+499);if(error)throw new APIError('Live records could not be read. No partial report generated.',503);rows.push(...data);if(rows.length>10000)throw new APIError('More than 10,000 orders. Request an operator-assisted dated export; nothing was silently omitted.',413);if(data.length<500)return rows;}throw new APIError('Live report is too large.',413);}
