import {api} from '@/lib/server';
import {testnetAccount} from '@/lib/testnet-transfer';
import {testnetRpc,testnetAccountResponse} from '@/lib/testnet-rpc';
import {fromYoctoNear} from '@/lib/wallet-balance';
export async function GET(request:Request){return api(request,async()=>{const accountId=testnetAccount.parse(new URL(request.url).searchParams.get('accountId'));const {result,provider}=await testnetRpc('query',{request_type:'view_account',finality:'final',account_id:accountId});const account=testnetAccountResponse.parse(result);return {network:'testnet',accountId,balance:fromYoctoNear(account.amount),amountAtomic:account.amount,blockHeight:account.block_height,provider,checkedAt:new Date().toISOString(),notice:'Valueless test NEAR. Account balance includes storage reserve.'};});}
