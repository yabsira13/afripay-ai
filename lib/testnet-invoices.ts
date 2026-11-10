import {z} from 'zod';
import {testnetAccount,inspectTestnetOutcome,prepareTestnetTransfer} from './testnet-transfer';
export const testnetInvoiceDraft=z.object({id:z.uuid(),reference:z.string().trim().min(1).max(80),receiver:testnetAccount,amount:z.string().regex(/^\d+(?:\.\d+)?$/).max(60),description:z.string().trim().max(500)}).strict().superRefine((v,c)=>{try{prepareTestnetTransfer(v.receiver==='validation.testnet'?'other.testnet':'validation.testnet',v.receiver,v.amount);}catch(e){c.addIssue({code:'custom',message:(e as Error).message,path:['amount']});}});
export function verifyTestnetInvoice(raw:unknown,invoice:{funding_hash:string;sender:string;receiver:string;amount:string;min_block_height:number;created_at:string},height:number,blockTimestampNs:string){
 const outcome=inspectTestnetOutcome(raw,{hash:invoice.funding_hash,sender:invoice.sender,receiver:invoice.receiver,amount:invoice.amount});
 if(outcome.status==='confirmed'){
 const created=Date.parse(invoice.created_at);
 if(!Number.isSafeInteger(height)||height<=invoice.min_block_height||!Number.isFinite(created)||!/^\d+$/.test(blockTimestampNs)||BigInt(blockTimestampNs)<BigInt(created)*1000000n)throw new Error('This transaction predates the invoice or its block evidence is invalid. It cannot pay this invoice.');
 }
 return outcome;
}
