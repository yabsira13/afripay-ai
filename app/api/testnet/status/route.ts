import {z} from 'zod';
import {api,json,APIError} from '@/lib/server';
import {testnetAccount,testnetHash,inspectTestnetOutcome,prepareTestnetTransfer} from '@/lib/testnet-transfer';
import {testnetRpc} from '@/lib/testnet-rpc';
const schema=z.object({hash:testnetHash,sender:testnetAccount,receiver:testnetAccount,amount:z.string().regex(/^\d+(?:\.\d+)?$/).max(60)}).strict();
export async function POST(request:Request){return api(request,async()=>{const expected=schema.parse(await json(request));try{prepareTestnetTransfer(expected.sender,expected.receiver,expected.amount);}catch(err){throw new APIError((err as Error).message);}const {result,provider}=await testnetRpc('tx',{tx_hash:expected.hash,sender_account_id:expected.sender,wait_until:'FINAL'});let outcome;try{outcome=result?inspectTestnetOutcome(result,expected):{status:'pending',reason:'The provider has not returned final execution yet.'};}catch(err){throw new APIError((err as Error).message,409);}return {...outcome,network:'testnet',hash:expected.hash,provider,checkedAt:new Date().toISOString()};});}
