import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {validateSettings} from './setup-settings.mjs';
const path=resolve('.env.local');
let issue='';try{if(existsSync(path))process.loadEnvFile(path);validateSettings(process.env.NEXT_PUBLIC_SUPABASE_URL||'',process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'');}catch{issue='Missing or invalid Supabase public settings.';}
const ready=!issue;
console.log('\nAFRIPAY AI setup check');
if(ready)console.log('Supabase settings found. Account access can be tested in the browser.');
else{console.log('Account access is not configured in THIS project folder. Demo remains available.');console.log('Copy your previous .env.local to: '+path);console.log('Required names: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');}
if(!ready)console.log('Easier repair: npm.cmd run setup. Paste the project URL and publishable key when asked.');
console.log('Profile setup: run supabase/account-profiles.sql in your Supabase project once.');
console.log('Cloud demo save setup: run supabase/workspace-sync.sql once.');
console.log('Mainnet payments remain disabled. NEAR testnet uses valueless test tokens only.\n');
