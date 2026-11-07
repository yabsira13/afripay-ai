import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import {existsSync,readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {updateSettings,validateSettings} from './setup-settings.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=resolve(root,'.env.local');
const input=createInterface({input:stdin,output:stdout});
try{
 stdout.write('AFRIPAY account setup\nUse your Supabase project URL and PUBLIC publishable key. Never enter a secret key.\n');
 const url=(await input.question('Supabase project URL: ')).trim();
 const key=(await input.question('Supabase publishable key: ')).trim();
 validateSettings(url,key);
 const previous=existsSync(file)?readFileSync(file,'utf8'):'';
 if(previous)copyFileSync(file,resolve(root,'.env.local.backup-'+Date.now()));
 writeFileSync(file,updateSettings(previous,url,key),{mode:0o600});
 stdout.write('Saved .env.local in this project. Existing unrelated settings were preserved.\nStart with npm.cmd run dev, then refresh your browser.\n');
}catch(error){console.error(error.message);process.exitCode=1;}finally{input.close();}
