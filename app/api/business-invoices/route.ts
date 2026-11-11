import {z} from 'zod';
import {api,json,APIError} from '@/lib/server';
import {liveUser} from '@/lib/live-server';
import {businessInvoices,deliverBusinessInvoice} from '@/lib/business-invoice-server';
export async function GET(request:Request){return api(request,async()=>{const {user,db}=await liveUser(request);return businessInvoices(db,user);});}
export async function POST(request:Request){return api(request,async()=>{const {user,db}=await liveUser(request),raw=await json(request);if(raw.action==='refresh'){z.object({action:z.literal('refresh')}).strict().parse(raw);return businessInvoices(db,user,true);}if(raw.action!=='create')throw new APIError('Unknown invoice action.');const {action,...input}=raw;return {invoice:await deliverBusinessInvoice(db,user,input)};});}
