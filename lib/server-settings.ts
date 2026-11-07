import {checkAuthSettings} from './auth-settings';
// Computed names deliberately read runtime settings instead of Next's build substitutions.
export const runtimeSetting=(name:string)=>process.env[name];
export function serverAuthSettings(){return checkAuthSettings(runtimeSetting('NEXT_PUBLIC_SUPABASE_URL'),runtimeSetting('NEXT_PUBLIC_SUPABASE_ANON_KEY'));}
