import {z} from 'zod';
import {api,json,APIError} from '@/lib/server';
import {liveUser} from '@/lib/live-server';
import {testnetAccount,testnetHash} from '@/lib/testnet-transfer';
import {checkTestnetTransfer,saveTestnetTransfer} from '@/lib/testnet-activity-server';
import {testnetTransferRecord} from '@/lib/testnet-activity';
const input=z.object({hash:testnetHash,sender:testnetAccount,receiver:testnetAccount.optional(),amount:z.string().regex(/^\d+(?:\.\d+)?$/).max(60).optional()}).strict();
export async function GET(request:Request){return api(request,async()=>{const {db}=await liveUser(request),account=testnetAccount.parse(new URL(request.url).searchParams.get('account'));const {data,error}=await db.from('testnet_transfers').select('hash,sender,receiver,amount_atomic,block_height,block_timestamp,verified_at,provider').or('sender.eq.'+account+',receiver.eq.'+account).order('block_timestamp',{ascending:false}).limit(101);if(error)throw new APIError('Shared testnet history is unavailable. Run supabase/testnet-activity.sql, then refresh.',503);return {network:'testnet',account,transfers:testnetTransferRecord.array().parse(data.slice(0,100)),hasMore:data.length>100,notice:'Latest 100 native transfers verified and saved by AFRIPAY. This is not complete blockchain history. Public wallet lookup does not establish account ownership.'};});}
export async function POST(request:Request){return api(request,async()=>{const {db}=await liveUser(request),expected=input.parse(await json(request)),outcome=await checkTestnetTransfer(expected);if(outcome.record)await saveTestnetTransfer(db,outcome.record);return {network:'testnet',...outcome};});}
