import {z} from 'zod';
import {toAtomic} from './amount';
import {validAddress} from './security';
export const nativeAsset='nep141:wrap.near';
export const mainnetAccount=z.string().min(2).max(64).regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/).refine(v=>!v.endsWith('.testnet'),'Use a NEAR mainnet account.');
export const liveHash=z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,64}$/);
export const liveInput=z.object({requestId:z.string().uuid(),repeatOf:z.string().uuid().optional(),repeatConfirmed:z.literal(true).optional(),requestToken:z.string().regex(/^[a-f0-9]{64}$/).optional(),sender:mainnetAccount,recipient:z.string().min(2).max(128),destinationAsset:z.string().min(1).max(200),destinationChain:z.enum(['near','eth','base','arb','polygon','bsc','optimism','sol']),amount:z.string().regex(/^\d+(?:\.\d{1,30})?$/).max(70),invoiceReference:z.string().trim().min(1).max(100),invoiceText:z.string().max(12000).default(''),recipientVerified:z.literal(true),slippage:z.number().int().min(1).max(100)}).strict();
export type LiveInput=z.infer<typeof liveInput>;
export const supportedToken=z.object({assetId:z.string().max(200),symbol:z.string().max(30),blockchain:z.string().max(30),decimals:z.number().int().min(0).max(30),contractAddress:z.string().nullable().optional()}).passthrough();
export type LiveToken=z.infer<typeof supportedToken>;
export const uint=z.string().regex(/^(0|[1-9]\d{0,77})$/);
const positive=uint.refine(v=>BigInt(v)>0n);
export const signedQuote=z.object({correlationId:z.string().min(1).max(200),timestamp:z.string().datetime(),signature:z.string().min(1).max(500),quoteRequest:z.record(z.string(),z.unknown()),quote:z.object({amountIn:positive,amountOut:positive,minAmountOut:positive,amountInFormatted:z.string(),amountOutFormatted:z.string(),timeEstimate:z.number().nonnegative(),deadline:z.string().datetime().optional(),timeWhenInactive:z.string().datetime().optional(),depositAddress:z.string().optional(),depositMemo:z.string().optional(),refundFee:uint.optional(),withdrawFee:uint.optional()}).passthrough()}).passthrough();
export type SignedQuote=z.infer<typeof signedQuote>;
export function makeLiveRequest(input:LiveInput,tokens:LiveToken[],now=Date.now()){
 const target=tokens.find(t=>t.assetId===input.destinationAsset&&t.blockchain===input.destinationChain);
 const source=tokens.find(t=>t.assetId===nativeAsset&&t.blockchain==='near'&&t.decimals===24);
 if(!target||!source)throw new Error('Select assets from the current supported token list.');
 if(target.assetId===nativeAsset)throw new Error('Choose a different destination asset for this Intents payment.');
 if(!validAddress(input.recipient,target.blockchain))throw new Error('Recipient format does not match the destination network.');
 if(target.blockchain==='near')mainnetAccount.parse(input.recipient);
 const amount=toAtomic(input.amount,target.decimals);
 return {target,request:{dry:true,swapType:'EXACT_OUTPUT',originAsset:nativeAsset,destinationAsset:target.assetId,amount,slippageTolerance:input.slippage,depositType:'ORIGIN_CHAIN',recipientType:'DESTINATION_CHAIN',refundType:'ORIGIN_CHAIN',recipient:input.recipient,refundTo:input.sender,deadline:new Date(now+600000).toISOString()}};
}
export function validateLiveQuote(raw:unknown,expected:Record<string,unknown>,now=Date.now(),committed=false){
 const result=signedQuote.parse(raw);const request=result.quoteRequest;
 for(const [key,value] of Object.entries(expected))if(request[key]!==value)throw new Error('Quote changed the reviewed '+key+'.');
 for(const key of ['customRecipientMsg','virtualChainRecipient','virtualChainRefundRecipient','appFees','rebates','referral','confidentiality'])if(request[key]!==undefined&&request[key]!==null&&request[key]!==false&&request[key]!==''&&!(Array.isArray(request[key])&&request[key].length===0)&&request[key]!=='public')throw new Error('Unexpected execution instructions in quote.');
 if(!Number.isFinite(Date.parse(result.timestamp))||Math.abs(now-Date.parse(result.timestamp))>120000)throw new Error('Quote timestamp is stale or in the future.');
 if(request.depositMode!==undefined&&request.depositMode!=='SIMPLE')throw new Error('Unsupported deposit mode.');
 const expiration=Math.min(Date.parse(result.timestamp)+120000,Date.parse(String(request.deadline)),...['deadline','timeWhenInactive'].map(k=>result.quote[k]?Date.parse(String(result.quote[k])):Infinity));
 if(!Number.isFinite(expiration)||expiration<=now+30000)throw new Error('Quote expires too soon. Request a new quote.');
 if(BigInt(result.quote.minAmountOut)<BigInt(String(expected.amount)))throw new Error('Minimum output does not cover the requested invoice amount.');
 if(committed){mainnetAccount.parse(result.quote.depositAddress);if(result.quote.depositMemo)throw new Error('Memo funding is not supported. Nothing was sent.');if(result.quote.depositAddress===expected.refundTo||result.quote.depositAddress===expected.recipient)throw new Error('Unexpected deposit address.');}
 else if(result.quote.depositAddress||result.quote.depositMemo)throw new Error('Dry quote unexpectedly returned funding instructions.');
 return {...result,expiresAt:new Date(expiration).toISOString()};
}
const success=(s:any)=>s&&typeof s==='object'&&('SuccessValue'in s||'SuccessReceiptId'in s);
export function verifyNativeDeposit(raw:any,hash:string,sender:string,deposit:string,amount:string){
 liveHash.parse(hash);const tx=raw?.transaction;
 if(tx?.hash!==hash||tx.signer_id!==sender||tx.receiver_id!==deposit||!Array.isArray(tx.actions)||tx.actions.length!==1||Object.keys(tx.actions[0]).length!==1||tx.actions[0]?.Transfer?.deposit!==amount)throw new Error('On-chain funding does not match this payment.');
 if(raw.final_execution_status!=='FINAL')return false;
 if(!success(raw.status)||!success(raw.transaction_outcome?.outcome?.status)||!Array.isArray(raw.receipts_outcome)||!raw.receipts_outcome.length||!raw.receipts_outcome.every((r:any)=>success(r.outcome?.status))||!raw.receipts_outcome.some((r:any)=>r.outcome.executor_id===deposit))throw new Error('Final funding execution was not successful. Do not resend until reviewed.');
 return true;
}
export function settlementEvidence(raw:any,order:{committed_quote:SignedQuote;funding_hash:string}){
 const state=z.enum(['PENDING_DEPOSIT','KNOWN_DEPOSIT_TX','PROCESSING','SUCCESS','INCOMPLETE_DEPOSIT','REFUNDED','FAILED']).parse(raw?.status);
 if(state!=='SUCCESS')return {state,settled:false};
 const d=raw.swapDetails;
 if(!d||!Array.isArray(d.originChainTxHashes)||!d.originChainTxHashes.some((t:any)=>t.hash===order.funding_hash)||!Array.isArray(d.destinationChainTxHashes)||!d.destinationChainTxHashes.length||!d.destinationChainTxHashes.every((t:any)=>typeof t.hash==='string'&&t.hash.length>=20)||!uint.safeParse(d.amountOut).success||BigInt(d.amountOut)<BigInt(order.committed_quote.quote.minAmountOut)||!uint.safeParse(d.amountIn).success||d.amountIn!==order.committed_quote.quote.amountIn)throw new Error('Settlement evidence is incomplete or does not match this funded payment.');
 return {state,settled:true};
}
export function walletFundingRequest(order:{sender:string;committed_quote:SignedQuote;expires_at:string},now=Date.now()){
 mainnetAccount.parse(order.sender);const q=order.committed_quote.quote;mainnetAccount.parse(q.depositAddress);
 if(q.depositMemo||Date.parse(order.expires_at)<=now+15000)throw new Error('Payment funding expired. Do not send.');
 return {network:'mainnet' as const,signerId:order.sender,receiverId:q.depositAddress!,actions:[{type:'Transfer' as const,params:{deposit:q.amountIn}}]};
}
