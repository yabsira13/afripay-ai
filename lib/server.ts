import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
const buckets = new Map<string,{count:number;reset:number}>();
export class APIError extends Error {constructor(message: string,public status=400,public recovery?:{existingOrderId:string}){super(message);}}
export async function api(request: Request, action: ()=>Promise<unknown>) {
 try {
  const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local';
  const key=ip+':'+new URL(request.url).pathname;const now=Date.now();const bucket=buckets.get(key);
  if(bucket&&bucket.reset>now){if(bucket.count>=30) throw new APIError('Too many requests. Try again in one minute.',429);bucket.count++;}
  else buckets.set(key,{count:1,reset:now+60000});
  if(buckets.size>10000) for(const [k,v] of buckets) if(v.reset<now)buckets.delete(k);
  const origin=request.headers.get('origin');
  const expectedOrigin=new URL(request.url);
  // Next may construct request.url with its internal hostname; Host preserves the browser's origin.
  if(request.headers.get('host'))expectedOrigin.host=request.headers.get('host')!;
  if(request.method!=='GET' && origin && origin!==expectedOrigin.origin) throw new APIError('Cross-origin request denied.',403);
  if(Number(request.headers.get('content-length')||0)>2_000_000) throw new APIError('Request is too large.',413);
  return NextResponse.json(await action(),{headers:{'Cache-Control':'no-store'}});
 } catch(error) {
  if(error instanceof ZodError)return NextResponse.json({error:'Invalid input',details:error.issues.map(i=>({path:i.path,message:i.message}))},{status:400});
  return NextResponse.json({error:error instanceof APIError?error.message:'Service unavailable. No payment was initiated.',...(error instanceof APIError&&error.recovery?{recovery:error.recovery}:{})},{status:error instanceof APIError?error.status:503});
 }
}
export async function json(request: Request) {const raw=await request.text();if(raw.length>2_000_000)throw new APIError('Request too large.',413);try{return JSON.parse(raw);}catch{throw new APIError('Invalid JSON.');}}
export async function oneClick(path:string,body?:unknown) {
 const response=await fetch('https://1click.chaindefuser.com/v0'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(process.env.ONECLICK_API_KEY?{'X-API-Key':process.env.ONECLICK_API_KEY}:{}),...(process.env.ONECLICK_API_TOKEN?{Authorization:`Bearer ${process.env.ONECLICK_API_TOKEN}`}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000),cache:'no-store'});
 if(!response.ok)throw new APIError(`NEAR Intents returned HTTP ${response.status}. Live data unavailable; no simulated result was substituted.`,502);
 return response.json();
}
