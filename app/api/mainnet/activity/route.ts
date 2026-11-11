import {z} from 'zod';
import {api,json} from '@/lib/server';
import {liveUser} from '@/lib/live-server';
import {nativeActivity,reconcileNativeActivity} from '@/lib/mainnet-activity-server';
export async function GET(request:Request){return api(request,async()=>{const {db}=await liveUser(request);return nativeActivity(db,new URL(request.url).searchParams.get('account')||'');});}
export async function POST(request:Request){return api(request,async()=>{const {db}=await liveUser(request);const input=z.object({account:z.string()}).strict().parse(await json(request));return reconcileNativeActivity(db,input.account);});}
