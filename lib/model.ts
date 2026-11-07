import {createClient} from '@supabase/supabase-js';
import {APIError} from './server';
import {serverAuthSettings,runtimeSetting} from './server-settings';

/** Paid inference needs a verified account. Never accept an arbitrary user ID. */
export async function requireModelUser(request:Request){
 const configured=serverAuthSettings().settings;
 const token=request.headers.get('authorization')?.match(/^Bearer (\S+)$/)?.[1];
 if(!configured||!token)throw new APIError('Sign in before using the configured AI provider. Local tools remain available.',401);
 const client=createClient(configured.url,configured.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data,error}=await client.auth.getUser(token);
 if(error||!data.user)throw new APIError('Your session could not be verified. Sign in again.',401);
 return data.user.id;
}
export async function structuredModel(name:string,schema:unknown,system:string,input:unknown):Promise<unknown>{
 const apiKey=runtimeSetting('AI_API_KEY');
 if(!apiKey)throw new APIError('AI provider is not configured. Use the local tools instead.',503);
 const base=(runtimeSetting('AI_BASE_URL')||'https://api.openai.com/v1').replace(/\/$/,'');
 let response:Response;
 try{response=await fetch(base+'/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({model:runtimeSetting('AI_MODEL')||'gpt-4.1-mini',temperature:0,messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(input)}],response_format:{type:'json_schema',json_schema:{name,strict:true,schema}}}),signal:AbortSignal.timeout(30000)});}catch{throw new APIError('AI provider is unavailable. Nothing was approved or sent.',502);}
 if(!response.ok)throw new APIError('AI provider rejected the request. Nothing was approved or sent.',502);
 try{const data=await response.json();return JSON.parse(data.choices[0].message.content);}catch{throw new APIError('AI response was invalid. Nothing was approved or sent.',502);}
}
