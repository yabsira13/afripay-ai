import {z} from 'zod';
import {validAddress} from './security';
export type PaymentIntent = { intent: 'payment' | 'help'; amount: string | null; asset: string | null; recipient: string | null; missing: string[]; requiresApproval: true; executionAllowed: false };
export const proposalSchema=z.object({intent:z.enum(['payment','help']),amount:z.string().regex(/^\d+(?:\.\d{1,8})?$/).max(30).nullable(),asset:z.enum(['USDC','USDT','NEAR','USD','ETH']).nullable(),recipient:z.string().max(200).nullable()}).strict();
export const proposalJsonSchema={type:'object',properties:{intent:{type:'string',enum:['payment','help']},amount:{type:['string','null']},asset:{type:['string','null'],enum:['USDC','USDT','NEAR','USD','ETH',null]},recipient:{type:['string','null']}},required:['intent','amount','asset','recipient'],additionalProperties:false};
export function validateModelIntent(output:unknown,text:string):PaymentIntent {
 const proposal=proposalSchema.parse(output);
 const words:string[]=Array.from(text.toUpperCase().match(/[A-Z0-9]+/g)||[]);
 if(proposal.amount&&(!Number.isFinite(Number(proposal.amount))||Number(proposal.amount)<=0||!text.match(/\b\d+(?:\.\d+)?\b/g)?.includes(proposal.amount)))throw new Error('AI amount is not supported by the supplied message.');
 if(proposal.asset&&!words.includes(proposal.asset))throw new Error('AI asset is not supported by the supplied message.');
 if(proposal.recipient&&(!text.includes(proposal.recipient)||!validAddress(proposal.recipient,proposal.recipient.startsWith('0x')?'base':'near')))throw new Error('AI recipient is not supported by the supplied message.');
 const intent:PaymentIntent={...proposal,missing:[],requiresApproval:true,executionAllowed:false};
 if(intent.intent==='help'){intent.amount=null;intent.asset=null;intent.recipient=null;return intent;}
 if(!intent.amount)intent.missing.push('amount');if(!intent.asset)intent.missing.push('asset');if(!intent.recipient)intent.missing.push('verified recipient');intent.missing.push('source asset, chain and refund address');
 return intent;
}
export function intentMessage(intent:PaymentIntent){return intent.intent==='payment'?`I can prepare ${intent.amount||'an amount of'} ${intent.asset||'your chosen asset'}. I still need: ${intent.missing.join(', ')}. A mentioned address is not verified. Select and independently confirm your supplier in the payment form. I cannot authorize or sign a payment.`:'I can help prepare payments, review invoice discrepancies and explain security evidence. Try “Pay my supplier 200 USDC.”';}
export function parseIntent(text: string): PaymentIntent {
 const payment = /\b(pay|send|transfer)\b/i.test(text);
 const match=text.match(/\b(\d+(?:\.\d{1,8})?)\s*(USDC|USDT|NEAR|USD|ETH)\b/i);
 const address=text.match(/\b(0x[a-fA-F0-9]{40}|[a-z0-9._-]+\.near)\b/);
 const result: PaymentIntent={intent:payment?'payment':'help',amount:match?.[1]||null,asset:match?.[2]?.toUpperCase()||null,recipient:address?.[1]||null,missing:[],requiresApproval:true,executionAllowed:false};
 if(payment) {if(!result.amount)result.missing.push('amount');if(!result.asset)result.missing.push('asset');if(!result.recipient)result.missing.push('verified recipient');result.missing.push('source asset, chain and refund address');}
 return result;
}
