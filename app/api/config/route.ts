import {APP_VERSION} from '@/lib/release';
import {serverAuthSettings,runtimeSetting} from '@/lib/server-settings';
export const dynamic='force-dynamic';
export async function GET(){
 const auth=serverAuthSettings();
 return Response.json({version:APP_VERSION,testnetTransfersEnabled:true,authConfigured:!!auth.settings,authSetupIssue:auth.issue,supabase:auth.settings,aiConfigured:!!runtimeSetting('AI_API_KEY'),liveFundingEnabled:false,mode:'simulated demo; read-only mainnet wallet; wallet-authorized NEAR testnet lab'},{headers:{'Cache-Control':'no-store'}});
}
