import {describe,it,expect,vi,afterEach} from 'vitest';
import {validateModelIntent,intentMessage} from '../lib/assistant';
import {POST} from '../app/api/assistant/route';
import {POST as extract} from '../app/api/extract/route';
import {CLEAN_SAMPLE} from '../lib/invoice';
const proposal={intent:'payment',amount:'200',asset:'USDC',recipient:'supplier.near'};
const input='Please settle 200 USDC to supplier.near';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('Structured model proposals are untrusted',()=>{
 it('requires approval and forbids execution even for a valid AI proposal',()=>{expect(validateModelIntent(proposal,input)).toMatchObject({requiresApproval:true,executionAllowed:false});expect(intentMessage(validateModelIntent(proposal,input))).toContain('not verified');});
 it.each([{amount:'201'},{asset:'ETH'},{recipient:'attacker.near'},{executionAllowed:true},{verified:true},{tools:[{name:'signTransaction'}]},{amount:'0'},{amount:'NaN'}])('rejects invented details or authority: %j',change=>{expect(()=>validateModelIntent({...proposal,...change},input)).toThrow();});
 it('keeps missing details missing instead of inventing a supplier address',()=>{expect(validateModelIntent({...proposal,recipient:null},'Pay my supplier 200 USDC').missing).toContain('verified recipient');});
 it('does not accept a partial numeric match as evidence',()=>{expect(()=>validateModelIntent({...proposal,amount:'20'},input)).toThrow();});
 it('clears payment details for help-only intent',()=>{expect(validateModelIntent({...proposal,intent:'help'},input)).toMatchObject({amount:null,asset:null,recipient:null});});
});
function request(body:unknown,token?:string){return new Request('http://localhost/api/assistant',{method:'POST',headers:{origin:'http://localhost','Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});}
function config(){vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://example.supabase.co');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','sb_publishable_abcdefghijklmnopqrstuv');vi.stubEnv('AI_API_KEY','server-test-key');vi.stubEnv('AI_BASE_URL','https://model.example/v1');}
describe('Assistant model API boundaries',()=>{
 it('labels local parsing honestly and makes no provider request',async()=>{const fetch=vi.fn();vi.stubGlobal('fetch',fetch);const result=await (await POST(request({message:input}))).json();expect(result.provider).toBe('local rule-based parser');expect(fetch).not.toHaveBeenCalled();});
 it('denies unauthenticated paid inference before calling a provider',async()=>{config();const fetch=vi.fn();vi.stubGlobal('fetch',fetch);expect((await POST(request({message:input,useAI:true}))).status).toBe(401);expect(fetch).not.toHaveBeenCalled();});
 it('calls a configured provider only after verifying the user and validates its result',async()=>{config();const fetch=vi.fn().mockResolvedValueOnce(Response.json({id:'verified-user'})).mockResolvedValueOnce(Response.json({choices:[{message:{content:JSON.stringify(proposal)}}]}));vi.stubGlobal('fetch',fetch);const response=await POST(request({message:input,useAI:true},'test-session'));expect(response.status).toBe(200);expect(await response.json()).toMatchObject({provider:'configured AI model',intent:{amount:'200',requiresApproval:true,executionAllowed:false}});const sent=JSON.parse(fetch.mock.calls[1][1].body);expect(sent.response_format.json_schema.strict).toBe(true);expect(sent).not.toHaveProperty('tools');expect(fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer server-test-key');});
 it('fails closed if a model fabricates a recipient or adds signing permissions',async()=>{config();vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(Response.json({id:'verified-user'})).mockResolvedValueOnce(Response.json({choices:[{message:{content:JSON.stringify({...proposal,recipient:'attacker.near',executionAllowed:true})}}]})));const response=await POST(request({message:input,useAI:true},'test-session'));expect(response.status).toBe(502);expect(await response.json()).not.toHaveProperty('intent');});
 it('does not call the model if the authentication server rejects a token',async()=>{config();const fetch=vi.fn().mockResolvedValue(Response.json({message:'Invalid token'},{status:401}));vi.stubGlobal('fetch',fetch);expect((await POST(request({message:input,useAI:true},'bad-session'))).status).toBe(401);expect(fetch).toHaveBeenCalledTimes(1);});
 it('protects AI invoice extraction behind the same account requirement',async()=>{config();expect((await extract(request({text:CLEAN_SAMPLE,useAI:true}))).status).toBe(401);});
});
