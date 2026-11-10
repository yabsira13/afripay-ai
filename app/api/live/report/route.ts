import {api} from '@/lib/server';
import {liveUser,allLiveOrders} from '@/lib/live-server';
import {liveCsv,liveSummary} from '@/lib/live-reporting';
export async function GET(request:Request){return api(request,async()=>{const {user,db}=await liveUser(request);const rows=await allLiveOrders(db,user);return new URL(request.url).searchParams.get('format')==='csv'?{csv:liveCsv(rows),count:rows.length,scope:'All account orders through export start; maximum 10,000, never silently truncated'}:{summary:liveSummary(rows)};});}
