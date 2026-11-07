import {z} from 'zod';
export const profileSchema=z.object({full_name:z.string().trim().min(2,'Enter your full name.').max(100),account_type:z.enum(['customer','supplier']),business_name:z.string().trim().min(2,'Enter your business name.').max(160),country:z.string().trim().min(2,'Enter your country.').max(80),reporting_currency:z.literal('USD')}).strict();
export const signupDetailsSchema=z.object({full_name:z.string().trim().min(2,'Enter your full name.').max(100),account_type:z.enum(['customer','supplier'])}).strict();
export type ProfileFields=z.infer<typeof profileSchema>;
export type AccountProfile=ProfileFields&{user_id:string;onboarding_completed:boolean;created_at?:string;updated_at?:string};
export const emptyProfile:ProfileFields={full_name:'',account_type:'customer',business_name:'',country:'',reporting_currency:'USD'};
export function profileInitials(name:string){const words=name.trim().split(/\s+/).filter(Boolean);return words.length?(words[0][0]+(words.length>1?words[words.length-1][0]:'')).toUpperCase():'U';}
export function displayIdentity(userId:string|null|undefined,profile:AccountProfile|null){
 if(!userId)return {name:'Demo user',firstName:'Demo user',business:'Sample business',initials:'DU',businessInitials:'SB',sample:true};
 const own=profile?.user_id===userId?profile:null;
 const name=own?.full_name.trim()||'Your account',business=own?.business_name.trim()||'Set up your business';
 return {name,firstName:own?.full_name.trim().split(/\s+/)[0]||'there',business,initials:own?.full_name?profileInitials(own.full_name):'U',businessInitials:own?.business_name?profileInitials(own.business_name):'B',sample:false};
}
export function profileSetupError(message:string){return /schema cache|does not exist|Could not find/i.test(message)?'The private profile database needs setup. Run supabase/account-profiles.sql in your Supabase SQL Editor, then retry.':message;}

export function editableProfile(profile:ProfileFields):ProfileFields{return {full_name:profile.full_name,account_type:profile.account_type,business_name:profile.business_name,country:profile.country,reporting_currency:profile.reporting_currency};}
