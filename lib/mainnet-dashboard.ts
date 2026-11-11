import type {MainnetTransfer} from './mainnet-activity';
import {fromYoctoNear} from './wallet-balance';
/** Atomic sums stay exact. Chart coordinates alone use floating-point display values. */
export function nativeChartDays(rows:MainnetTransfer[],account:string,now=new Date()){
 const days=Array.from({length:7},(_,i)=>{const d=new Date(now);d.setUTCDate(d.getUTCDate()-6+i);return {date:d.toISOString().slice(0,10),sent:0n,received:0n};});
 for(const row of new Map(rows.map(r=>[r.hash,r])).values()){const day=days.find(d=>d.date===new Date(row.verified_at).toISOString().slice(0,10));if(day){if(row.sender===account)day.sent+=BigInt(row.amount_atomic);if(row.receiver===account)day.received+=BigInt(row.amount_atomic);}}
 return days.map(d=>({date:d.date,sent:fromYoctoNear(d.sent.toString()),received:fromYoctoNear(d.received.toString())}));
}
