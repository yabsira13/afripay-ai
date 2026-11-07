import {z} from 'zod';
import {APIError} from './server';

export const nearAccountSchema=z.string().min(2).max(64).regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/,'Enter a valid NEAR account ID.').refine(value=>!value.endsWith('.testnet'),'This connection uses NEAR mainnet, not testnet.');
const atomic=z.string().regex(/^\d{1,80}$/);
const accountResult=z.object({amount:atomic,locked:atomic,storage_usage:z.number().int().nonnegative().safe(),block_height:z.number().int().nonnegative().safe(),block_hash:z.string().min(1)});
// Both public providers are listed in https://docs.near.org/api/rpc/providers .
const PROVIDERS=['https://free.rpc.fastnear.com','https://near.drpc.org'];
export type WalletBalance={mode:'live';network:'mainnet';asset:'NEAR';accountId:string;amountAtomic:string;balance:string;lockedAtomic:string;lockedBalance:string;storageUsageBytes:number;blockHeight:number;blockHash:string;provider:string;checkedAt:string;readOnly:true};
export function fromYoctoNear(value:string):string{
 if(!/^\d+$/.test(value))throw new Error('Balance must be an integer string.');
 const padded=BigInt(value).toString().padStart(25,'0');
 const whole=padded.slice(0,-24),fraction=padded.slice(-24).replace(/0+$/,'');
 return fraction?whole+'.'+fraction:whole;
}
export async function getWalletBalance(accountId:string):Promise<WalletBalance>{
 const account=nearAccountSchema.parse(accountId);
 for(const provider of PROVIDERS){
  try{
   const response=await fetch(provider,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:'afripay-balance',method:'query',params:{request_type:'view_account',finality:'final',account_id:account}}),signal:AbortSignal.timeout(8000),cache:'no-store'});
   if(!response.ok)continue;
   const data=await response.json();
   if(data.error?.cause?.name==='UNKNOWN_ACCOUNT')throw new APIError('This account was not found on NEAR mainnet. Check the connected account and network.',404);
   const parsed=accountResult.safeParse(data.result);
   if(!parsed.success)continue;
   const result=parsed.data;
   return {mode:'live',network:'mainnet',asset:'NEAR',accountId:account,amountAtomic:result.amount,balance:fromYoctoNear(result.amount),lockedAtomic:result.locked,lockedBalance:fromYoctoNear(result.locked),storageUsageBytes:result.storage_usage,blockHeight:result.block_height,blockHash:result.block_hash,provider,checkedAt:new Date().toISOString(),readOnly:true};
  }catch(error){if(error instanceof APIError)throw error;}
 }
 throw new APIError('Live wallet balance is unavailable. Please retry. No demo amount has been substituted.',503);
}
