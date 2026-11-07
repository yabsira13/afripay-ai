'use client';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {checkAuthSettings,type PublicAuthSettings} from './auth-settings';
let client:SupabaseClient|null=null;
let settings:PublicAuthSettings|null=null;
export function authClient(){
 if(client)return client;
 const configured=settings||checkAuthSettings(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).settings;
 if(configured){settings=configured;client=createClient(configured.url,configured.publishableKey);}
 return client;
}
/** Runtime public settings avoid a stale frontend build disabling configured auth. */
export async function initializeAuth(){
 const response=await fetch('/api/config',{cache:'no-store',signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw new Error('Account setup could not be checked. Check your connection and retry.');
 const data=await response.json();
 const result=checkAuthSettings(data.supabase?.url,data.supabase?.publishableKey);
 if(!data.authConfigured||!result.settings)throw new Error(typeof data.authSetupIssue==='string'&&data.authSetupIssue?data.authSetupIssue:'Account access is not configured on this server.');
 if(settings&&(settings.url!==result.settings.url||settings.publishableKey!==result.settings.publishableKey))throw new Error('Account settings changed. Refresh this page before signing in.');
 settings=result.settings;
 return authClient()!;
}
/** Bind an operation to this account's token, even if another tab switches accounts. */
export async function accountClient(userId:string){
 const shared=authClient();if(!shared)throw new Error('Supabase is not configured.');
 const {data,error}=await shared.auth.getSession();
 if(error||data.session?.user.id!==userId)throw new Error('Your account changed. Sign in again before saving.');
 return createClient(settings!.url,settings!.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{Authorization:'Bearer '+data.session.access_token}}});
}
