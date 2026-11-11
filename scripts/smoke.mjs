// Production HTTP integration check. Not an interactive preview server.
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:3187';
const child=spawn(process.execPath,['scripts/start.mjs'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe'],env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',APP_HOST:'127.0.0.1',PORT:'3187'}});
let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
try{
 let ready=false;
 for(let i=0;i<100;i++){if(child.exitCode!==null)throw new Error('Server exited: '+output);try{const r=await fetch(base+'/api/config');if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}
 assert(ready,'Production server must become ready');
 const paths=['/','/landing','/auth','/assistant','/invoices','/invoices/upload','/invoices/invoice-demo-1','/payments','/routes','/approval','/monitor','/transactions','/security','/wallet','/scam','/fraud','/phishing','/alerts','/analytics','/suppliers','/settings','/settings/security','/receive','/supplier/apply','/directory','/admin','/auth/forgot','/auth/reset','/onboarding','/wallet/setup','/demo/transfers','/transfer','/payments/preview','/receive/wallet','/transactions/preview','/near/checks','/pay/'+('a'.repeat(64)),'/privacy','/terms','/contact','/feedback'];
 for(const path of paths){const response=await fetch(base+path);assert.equal(response.status,200,path);const html=await response.text();assert(html.includes('AFRIPAY'),path+' must render app content');}
 for(const name of ['DejaVuSans.ttf','DejaVuSans-Bold.ttf','DejaVuSansMono.ttf']){const font=await fetch(base+'/fonts/'+name);assert.equal(font.status,200);const bytes=new Uint8Array(await font.arrayBuffer());assert.deepEqual([...bytes.slice(0,4)],[0,1,0,0],'Receipt font must be a TrueType font, not an HTML fallback');}
 const invalidWallet=await fetch(base+'/api/wallet/balance?accountId=wrong.testnet');assert.equal(invalidWallet.status,400,'Wallet balance API rejects wrong-network accounts without querying mainnet');
 const config=await (await fetch(base+'/api/config')).json();assert.equal(config.liveFundingEnabled,false);assert.equal(config.version,'0.9.4');const privateInvoices=await fetch(base+'/api/testnet/invoices');assert.equal(privateInvoices.status,401);const badTestnet=await fetch(base+'/api/testnet/account?accountId=wrong.near');assert.equal(badTestnet.status,400);
 const response=await fetch(base+'/api/extract',{method:'POST',headers:{'Content-Type':'application/json',origin:base},body:JSON.stringify({text:'Invoice: INV-SMOKE-200\nSupplier: Shenzhen Nova Trading\nTotal due: 200 USDC\nWallet: 0x4a6b9f3d82e150c769a205d18f3b47c9e602a8d1'})});assert.equal(response.status,200);const result=await response.json();assert.equal(result.fields.amount,'200');assert.equal(result.requiresVerification,true);
 console.log(`PASS: production server started; ${paths.length} page routes rendered; receipt fonts, config and extraction APIs passed.`);
}catch(err){console.error(output);throw err;}finally{if(child.exitCode===null&&child.signalCode===null){await new Promise(resolve=>{const timer=setTimeout(resolve,3000);child.once('exit',()=>{clearTimeout(timer);resolve();});child.kill('SIGTERM');});}}
