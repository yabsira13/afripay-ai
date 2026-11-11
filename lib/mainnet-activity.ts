import {z} from 'zod';
import {mainnetAccount,liveHash} from './live-payments';
import {fromYoctoNear} from './wallet-balance';
/** Public blockchain facts only; never expose the payer's private order or invoice. */
export const mainnetTransfer=z.object({hash:liveHash,sender:mainnetAccount,receiver:mainnetAccount,amount_atomic:z.string().regex(/^[1-9]\d*$/),verified_at:z.string().datetime({offset:true})});
export type MainnetTransfer=z.infer<typeof mainnetTransfer>;
export function publicNativeTransfer(row:any,account:string):MainnetTransfer|null{
 if(row.execution_kind!=='NATIVE_NEAR'||row.state!=='SUCCESS'||row.sender!==account&&row.recipient!==account||row.evidence?.verified!==true||row.evidence?.fundingFinal!==true||row.evidence?.direct?.hash!==row.funding_hash||row.evidence?.direct?.amountOut!==row.amount_out||row.evidence?.direct?.amountIn!==row.amount_out)return null;
 const record=mainnetTransfer.safeParse({hash:row.funding_hash,sender:row.sender,receiver:row.recipient,amount_atomic:row.amount_out,verified_at:row.evidence?.checkedAt});return record.success?record.data:null;
}
export function mainnetTotals(rows:MainnetTransfer[],account:string){let sent=0n,received=0n;for(const row of new Map(rows.map(r=>[r.hash,r])).values()){if(row.sender===account)sent+=BigInt(row.amount_atomic);if(row.receiver===account)received+=BigInt(row.amount_atomic);}return {sent:fromYoctoNear(sent.toString()),received:fromYoctoNear(received.toString())};}
