import { api, oneClick } from '@/lib/server';
export async function GET(request:Request){return api(request,async()=>({mode:'live',tokens:await oneClick('/tokens')}));}
