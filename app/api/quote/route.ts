import { z } from 'zod';
import { api, json, oneClick, APIError } from '@/lib/server';
import { toAtomic } from '@/lib/amount';
import { validAddress } from '@/lib/security';
import type { Token } from '@/lib/types';
const schema=z.object({amount:z.string().regex(/^\d+(?:\.\d{1,30})?$/).max(80),originAsset:z.string().min(1).max(200),destinationAsset:z.string().min(1).max(200),recipient:z.string().min(2).max(128),refundTo:z.string().min(2).max(128),slippageTolerance:z.number().int().min(1).max(300),dry:z.literal(true)}).strict();
export async function POST(request:Request){return api(request,async()=>{
 const input=schema.parse(await json(request));
 const tokens:Token[]=await oneClick('/tokens');
 const source=tokens.find(t=>t.assetId===input.originAsset),target=tokens.find(t=>t.assetId===input.destinationAsset);
 if(!source||!target)throw new APIError('Select currently supported source and destination tokens.');
 if(!validAddress(input.recipient,target.blockchain)||!validAddress(input.refundTo,source.blockchain))throw new APIError('Recipient or refund address does not match the selected chain. Only NEAR, supported EVM chains and Solana formats are accepted in this version.');
 let amount:string;try{amount=toAtomic(input.amount,source.decimals);}catch(err){throw new APIError((err as Error).message);}
 const quote=await oneClick('/quote',{dry:true,swapType:'EXACT_INPUT',slippageTolerance:input.slippageTolerance,originAsset:source.assetId,destinationAsset:target.assetId,amount,depositType:'ORIGIN_CHAIN',recipientType:'DESTINATION_CHAIN',refundType:'ORIGIN_CHAIN',recipient:input.recipient,refundTo:input.refundTo,deadline:new Date(Date.now()+180000).toISOString()});
 return {mode:'live',dry:true,source,target,result:quote,notice:'Genuine indicative quote. No deposit address requested. Live funding is disabled in this release.'};
});}
