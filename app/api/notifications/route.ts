import {z} from 'zod';
import {api,json} from '@/lib/server';
import {liveUser} from '@/lib/live-server';
import {observedWalletNotifications,listNotifications} from '@/lib/notifications-server';
export async function GET(request:Request){return api(request,async()=>{const {user,db}=await liveUser(request);return listNotifications(db,user);});}
export async function POST(request:Request){return api(request,async()=>{const {user,db}=await liveUser(request);const input=z.discriminatedUnion('action',[z.object({action:z.literal('sync'),account:z.string()}),z.object({action:z.literal('read'),id:z.uuid()})]).parse(await json(request));if(input.action==='sync')await observedWalletNotifications(db,user,input.account);else{const result=await db.from('account_notifications').update({read_at:new Date().toISOString()}).eq('owner_id',user).eq('id',input.id);if(result.error)throw result.error;}return listNotifications(db,user);});}
