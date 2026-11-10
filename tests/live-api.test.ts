import {describe,it,expect,vi,afterEach}from'vitest';
import {POST,GET}from'../app/api/live/route';
import {GET as config} from '../app/api/config/route';
import {verifyQuoteSignature,quoteHash}from'@defuse-protocol/one-click-sdk-typescript';
import nacl from 'tweetnacl';import{base58}from'@scure/base';
import {signed}from'../lib/live-server';
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('Live API security boundary',()=>{
 it('never returns server database or 1Click credentials in public configuration',async()=>{vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://test.supabase.co');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','sb_publishable_abcdefghijklmnopqrstuv');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','PRIVATE_DATABASE_VALUE');vi.stubEnv('ONECLICK_API_KEY','PRIVATE_PROVIDER_VALUE');vi.stubEnv('LIVE_PAYMENTS_ENABLED','true');const response=JSON.stringify(await(await config()).json());expect(response).not.toContain('PRIVATE_DATABASE_VALUE');expect(response).not.toContain('PRIVATE_PROVIDER_VALUE');expect(JSON.parse(response).liveFundingEnabled).toBe(true);});
 it('requires a verified session before every real payment operation',async()=>{for(const action of ['quote','commit','authorize','attach','monitor']){const response=await POST(new Request('http://localhost/api/live',{method:'POST',headers:{origin:'http://localhost','content-type':'application/json'},body:JSON.stringify({action})}));expect(response.status).toBe(401);}});
 it('denies cross-origin live requests',async()=>{expect((await POST(new Request('http://localhost/api/live',{method:'POST',headers:{origin:'https://evil.example'},body:'{}'}))).status).toBe(403);});
 it('does not expose private payment history without a session',async()=>{expect((await GET(new Request('http://localhost/api/live'))).status).toBe(401);});
 it('does not trust forged signatures or permit a custom verification key in production',()=>{const pair=nacl.sign.keyPair();const data:any={quoteRequest:{dry:false,recipient:'supplier.near'},quote:{amountIn:'1',amountOut:'2',depositAddress:'deposit.near'},timestamp:new Date().toISOString()};data.signature=base58.encode(nacl.sign.detached(new TextEncoder().encode(quoteHash(data)),pair.secretKey));expect(verifyQuoteSignature(data,base58.encode(pair.publicKey))).toBe(true);expect(()=>signed(data)).toThrow(/signature/);const tampered={...data,quote:{...data.quote,depositAddress:'attacker.near'}};expect(verifyQuoteSignature(tampered,base58.encode(pair.publicKey))).toBe(false);});
});
