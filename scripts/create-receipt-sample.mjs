import {readFile,writeFile} from 'node:fs/promises';
import {createDemoReceipt} from '../lib/receipt.ts';
const [regular,bold,mono]=await Promise.all(['DejaVuSans.ttf','DejaVuSans-Bold.ttf','DejaVuSansMono.ttf'].map(name=>readFile(new URL('../public/fonts/'+name,import.meta.url))));
const payment={id:'d9246e58-c3a3-4744-8003-d18ab689b3e0',supplier:'Shenzhen Nova Trading',amount:'200',asset:'USDC',recipient:'0x4a6b9f3d82e150c769a205d18f3b47c9e602a8d1',chain:'base',status:'Settled (demo)',createdAt:'2026-11-05T08:49:00.299Z',mode:'demo',risk:{score:0,level:'Low',evidence:[],recommendation:'',blocked:false},receipt:'DEMO-d9246e58-c3a3-4744-8003-d18ab689b3e0'};
const bytes=await createDemoReceipt(payment,{business:'Addis Coffee Export'},{regular,bold,mono});
await writeFile(new URL('../samples/AFRIPAY-professional-demo-receipt.pdf',import.meta.url),bytes);
console.log('Created samples/AFRIPAY-professional-demo-receipt.pdf');
