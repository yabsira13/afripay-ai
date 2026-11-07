export type PublicAuthSettings={url:string;publishableKey:string};
export type AuthSettingsCheck={settings:PublicAuthSettings|null;issue:string};
export function checkAuthSettings(url:unknown,key:unknown):AuthSettingsCheck {
 const fail=(issue:string):AuthSettingsCheck=>({settings:null,issue});
 if(typeof url!=='string'||!url.trim())return fail('Missing NEXT_PUBLIC_SUPABASE_URL.');
 if(typeof key!=='string'||!key.trim())return fail('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.');
 const value=key.trim();
 if(value.startsWith('sb_secret_'))return fail('Use the publishable key, not a Supabase secret key.');
 let validKey=/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(value);
 if(!validKey&&value.split('.').length===3){try{validKey=JSON.parse(atob(value.split('.')[1].replaceAll('-','+').replaceAll('_','/'))).role==='anon';}catch{}}
 if(!validKey)return fail('Use a Supabase publishable key (sb_publishable_…) or legacy anon key.');
 try{const parsed=new URL(url.trim());if(parsed.username||parsed.password||parsed.search||parsed.hash||!['','/'].includes(parsed.pathname))throw new Error();if(parsed.protocol!=='https:'&&!(parsed.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(parsed.hostname)))throw new Error();return {settings:{url:parsed.origin,publishableKey:value},issue:''};}catch{return fail('Supabase URL must be an HTTPS project URL, or a local development URL.');}
}
