import {z} from 'zod';
import {testnetAccount,testnetHash} from './testnet-transfer';
import {fromYoctoNear} from './wallet-balance';
export const testnetTransferRecord=z.object({hash:testnetHash,sender:testnetAccount,receiver:testnetAccount,amount_atomic:z.string().regex(/^\d+$/).refine(v=>BigInt(v)>0n&&BigInt(v)<=10n**24n),block_height:z.number().int().positive(),block_timestamp:z.string().datetime({offset:true}),verified_at:z.string().datetime({offset:true}),provider:z.string().min(1)});
export type TestnetTransferRecord=z.infer<typeof testnetTransferRecord>;
export function testnetTotals(rows:TestnetTransferRecord[],account:string){let sent=0n,received=0n;const unique=new Map(rows.map(row=>[row.hash,row]));for(const row of unique.values()){if(row.sender===account)sent+=BigInt(row.amount_atomic);if(row.receiver===account)received+=BigInt(row.amount_atomic);}return {sent:fromYoctoNear(sent.toString()),received:fromYoctoNear(received.toString())};}
export function testnetDirection(row:TestnetTransferRecord,account:string){if(row.sender===account)return 'Sent';if(row.receiver===account)return 'Received';throw new Error('Transaction does not belong to the displayed wallet.');}
