import {z} from 'zod';import {api,json} from '@/lib/server';import {analyzeUrl,walletEvidence} from '@/lib/security';
export async function POST(request:Request){return api(request,async()=>{
 const input=z.discriminatedUnion('kind',[z.object({kind:z.literal('url'),value:z.string().max(5000)}),z.object({kind:z.literal('wallet'),value:z.string().max(128),chain:z.string().max(30)})]).parse(await json(request));
 if(input.kind==='url')return {risk:analyzeUrl(input.value),mode:'heuristic',opened:false};
 const risk=walletEvidence(input.value,input.chain);let observation:unknown=null;
 if(input.chain==='near'&&!risk.evidence.some(e=>e.code==='invalid_wallet')){
  try{const response=await fetch('https://rpc.mainnet.near.org',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:'afripay',method:'query',params:{request_type:'view_account',finality:'final',account_id:input.value}}),signal:AbortSignal.timeout(10000)});const data=await response.json();if(data.result)observation={type:'on-chain observation',accountExists:true,blockHeight:data.result.block_height,source:'NEAR mainnet RPC',note:'Account existence is not a safety verdict.'};else observation={type:'unknown',note:'Account query did not return account data. This is not proof of fraud.'};}catch{observation={type:'unknown',note:'NEAR RPC unavailable. No on-chain observation could be verified.'};}
 }
 return {risk,observation,mode:'limited analysis',checkedAt:new Date().toISOString()};
});}
