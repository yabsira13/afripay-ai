import {z} from 'zod';
import {APIError} from './server';
const PROVIDERS=['https://test.rpc.fastnear.com','https://near-testnet.drpc.org'];
export async function testnetRpc(method:'query'|'tx',params:Record<string,unknown>){
 for(const provider of PROVIDERS){try{
  const response=await fetch(provider,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:'afripay-testnet',method:method==='tx'?'EXPERIMENTAL_tx_status':method,params}),signal:AbortSignal.timeout(10000),cache:'no-store'});
  if(!response.ok)continue;const data=await response.json();
  if(data.error?.cause?.name==='UNKNOWN_ACCOUNT')throw new APIError('Account not found on NEAR testnet. Create that testnet account first.',404);
  if(data.error?.cause?.name==='UNKNOWN_TRANSACTION'||data.error?.cause?.name==='TIMEOUT_ERROR')return {result:null,provider};
  if(data.result)return {result:data.result,provider};
 }catch(err){if(err instanceof APIError)throw err;}}
 throw new APIError('NEAR testnet RPC is unavailable. No simulated balance or success was substituted.',503);
}
export const testnetAccountResponse=z.object({amount:z.string().regex(/^\d+$/),locked:z.string().regex(/^\d+$/),block_height:z.number().int().nonnegative(),block_hash:z.string().min(1)});
