import {z} from 'zod';
import {api,json} from '@/lib/server';
import {networkSchema,lookupAccount,lookupHash,observeWallet,observeTransaction} from '@/lib/near-observations';
const schema=z.discriminatedUnion('kind',[z.object({kind:z.literal('wallet'),network:networkSchema,accountId:lookupAccount}).strict(),z.object({kind:z.literal('transaction'),network:networkSchema,sender:lookupAccount,hash:lookupHash}).strict()]);
export async function POST(request:Request){return api(request,async()=>{const input=schema.parse(await json(request));return input.kind==='wallet'?observeWallet(input.accountId,input.network):observeTransaction(input.hash,input.sender,input.network);});}
