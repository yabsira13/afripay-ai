import type {SupabaseClient} from '@supabase/supabase-js';
export type RecoveryGrant={userId:string;email?:string;expiresAt:number};
export function signupOutcome(data:{session:unknown;user:{identities?:unknown[]}|null}):'signed-in'|'confirmation'|'not-created'{
 if(data.session)return 'signed-in';
 if(!data.user||Array.isArray(data.user.identities)&&data.user.identities.length===0)return 'not-created';
 return 'confirmation';
}
export function recoveryCallback(href:string):{isRecovery:boolean;error:string|null}{
 const url=new URL(href),hash=new URLSearchParams(url.hash.slice(1));
 const code=hash.get('error_code')||url.searchParams.get('error_code');
 const failed=code||hash.get('error')||url.searchParams.get('error');
 const isRecovery=url.pathname==='/auth/reset'||hash.get('type')==='recovery'||url.searchParams.get('type')==='recovery';
 return {isRecovery,error:failed?(code==='otp_expired'?(isRecovery?'This reset link has expired or has already been used. Request a new reset email.':'This confirmation link has expired or has already been used. Try signing in or request a new confirmation email.'):'The email link could not be verified. Request a fresh email link.'):null};
}
export function validateNewPassword(password:string,confirmation:string){
 if(password.length<12)throw new Error('Use a password with at least 12 characters.');
 if(password!==confirmation)throw new Error('The two passwords do not match.');
}
/** Never treats a pre-existing sign-in session as proof that a recovery link was verified. */
export async function completePasswordRecovery(client:SupabaseClient,grant:RecoveryGrant|null,password:string,confirmation:string,now=Date.now()):Promise<{email:string;verified:boolean;cleanupError:boolean}>{
 validateNewPassword(password,confirmation);
 if(!grant||grant.expiresAt<=now)throw new Error('Open a fresh password-reset link from your email before changing your password.');
 const identity=await client.auth.getUser();
 if(identity.error)throw identity.error;
 if(identity.data.user?.id!==grant.userId||!identity.data.user.email)throw new Error('The signed-in account does not match this reset link. Request a fresh link and open it in this browser.');
 const email=identity.data.user.email;
 const updated=await client.auth.updateUser({password});
 if(updated.error)throw updated.error;
 if(updated.data.user?.id!==grant.userId)throw new Error('Password update could not be verified for this account. Do not retry with a different account signed in.');
 // Confirm that the new credential actually signs in. Never log or persist the password ourselves.
 let verified=false;
 try{const check=await client.auth.signInWithPassword({email,password});verified=!check.error&&check.data.user?.id===grant.userId&&!!check.data.session;}catch{}
 let cleanupError=false;
 try{const result=await client.auth.signOut({scope:'local'});cleanupError=!!result.error;}catch{cleanupError=true;}
 return {email,verified,cleanupError};
}
