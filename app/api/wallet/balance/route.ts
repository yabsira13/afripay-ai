import {api} from '@/lib/server';
import {getWalletBalance,nearAccountSchema} from '@/lib/wallet-balance';
export async function GET(request:Request){return api(request,async()=>{
 const accountId=nearAccountSchema.parse(new URL(request.url).searchParams.get('accountId'));
 return getWalletBalance(accountId);
});}
