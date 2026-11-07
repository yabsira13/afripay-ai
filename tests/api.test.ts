import {describe,it,expect,vi,afterEach} from 'vitest';
import {POST as extract} from '../app/api/extract/route';
import {POST as quote} from '../app/api/quote/route';
import {POST as analyze} from '../app/api/analyze/route';
import {GET as tokens} from '../app/api/tokens/route';
import {GET as status} from '../app/api/status/route';
import {CLEAN_SAMPLE} from '../lib/invoice';
const req=(path:string,body:unknown,origin='http://localhost')=>new Request('http://localhost/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',origin},body:JSON.stringify(body)});
afterEach(()=>vi.unstubAllGlobals());
describe('Validated API integration',()=>{
 it('extracts untrusted text and requires verification',async()=>{const response=await extract(req('extract',{text:CLEAN_SAMPLE}));const result=await response.json();expect(response.status).toBe(200);expect(result.fields.amount).toBe('200');expect(result.requiresVerification).toBe(true);});
 it('rejects cross-origin mutations',async()=>{expect((await extract(req('extract',{text:CLEAN_SAMPLE},'https://evil.example'))).status).toBe(403);});
 it('accepts same-origin requests when Next uses an internal hostname',async()=>{const request=new Request('http://localhost/api/extract',{method:'POST',headers:{origin:'http://127.0.0.1:3187',host:'127.0.0.1:3187','Content-Type':'application/json'},body:JSON.stringify({text:CLEAN_SAMPLE})});expect((await extract(request)).status).toBe(200);});
 it('rejects invalid payloads',async()=>{expect((await analyze(req('analyze',{kind:'wallet',value:42}))).status).toBe(400);});
 it('cannot request a committed quote',async()=>{const response=await quote(req('quote',{dry:false,amount:'200',originAsset:'source',destinationAsset:'target',recipient:'x.near',refundTo:'y.near',slippageTolerance:100}));expect(response.status).toBe(400);});
 it('reports upstream failure without inventing tokens',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('Forbidden',{status:403})));const response=await tokens(new Request('http://localhost/api/tokens'));expect(response.status).toBe(502);expect(await response.json()).not.toHaveProperty('tokens');});
 it('sends the researched dry quote format and exact atomic units',async()=>{const responseQuote={quote:{amountOut:'199500000',minAmountOut:'197505000',amountOutFormatted:'199.5',timeEstimate:60}};const fetchMock=vi.fn().mockResolvedValueOnce(Response.json([{assetId:'a',symbol:'USDC',decimals:6,blockchain:'near'},{assetId:'b',symbol:'USDC',decimals:6,blockchain:'base'}])).mockResolvedValueOnce(Response.json(responseQuote));vi.stubGlobal('fetch',fetchMock);const response=await quote(req('quote',{dry:true,amount:'200',originAsset:'a',destinationAsset:'b',recipient:'0x1111111111111111111111111111111111111111',refundTo:'refund.near',slippageTolerance:100}));expect(response.status).toBe(200);const submitted=JSON.parse(fetchMock.mock.calls[1][1].body);expect(submitted).toMatchObject({dry:true,amount:'200000000',swapType:'EXACT_INPUT',depositType:'ORIGIN_CHAIN'});expect(submitted.deadline).toBeTruthy();expect(await response.json()).toMatchObject({mode:'live',dry:true,result:responseQuote});});
 it.each(['FAILED','REFUNDED','INCOMPLETE_DEPOSIT','SUCCESS'])('preserves actual %s status without mutating any invoice',async(state)=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({status:state})));const response=await status(new Request('http://localhost/api/status?depositAddress=deposit.near'));expect(await response.json()).toMatchObject({mode:'live',result:{status:state}});});
});
