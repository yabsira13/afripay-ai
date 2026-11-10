import {it,expect,describe,vi} from 'vitest';
import {testnetInvoiceDraft,verifyTestnetInvoice} from '../lib/testnet-invoices';
import {withDeadline} from '../lib/deadline';
const hash='6zgh2u9DqHHiXzdy9ouTP7oGky2T4nugbhqsK7wQHnZS';
const invoice={funding_hash:hash,sender:'payer.testnet',receiver:'supplier.testnet',amount:'0.01',min_block_height:100,created_at:'2026-11-10T00:00:00.000Z'};
const result=()=>({final_execution_status:'FINAL',transaction:{hash,signer_id:invoice.sender,receiver_id:invoice.receiver,actions:[{Transfer:{deposit:'10000000000000000000000'}}]},transaction_outcome:{outcome:{status:{SuccessReceiptId:'receipt'}}},status:{SuccessValue:''},receipts_outcome:[{outcome:{executor_id:invoice.receiver,status:{SuccessValue:''}}}]});
describe('saved testnet invoice proof',()=>{
 it('requires transaction execution after invoice creation',()=>{expect(verifyTestnetInvoice(result(),invoice,101,'1794268801000000000').status).toBe('confirmed');for(const height of [99,100,NaN,Infinity,100.5])expect(()=>verifyTestnetInvoice(result(),invoice,height,'1794268801000000000')).toThrow(/predates/);});
 it('rejects a transaction timestamp before creation even in a later block',()=>{expect(()=>verifyTestnetInvoice(result(),invoice,101,'1794268799000000000')).toThrow(/predates/);});
 it('rejects a different destination or amount',()=>{expect(()=>verifyTestnetInvoice(result(),{...invoice,receiver:'other.testnet'},101,'1794268801000000000')).toThrow(/does not match/);expect(()=>verifyTestnetInvoice(result(),{...invoice,amount:'0.02'},101,'1794268801000000000')).toThrow(/does not match/);});
 it('keeps nonfinal transactions unpaid regardless of block height',()=>{expect(verifyTestnetInvoice({...result(),final_execution_status:'EXECUTED_OPTIMISTIC'},invoice,101,'1794268801000000000').status).toBe('pending');});
 it('does not turn failed execution into a paid invoice',()=>{expect(verifyTestnetInvoice({...result(),status:{Failure:{}}},invoice,101,'1794268801000000000').status).toBe('failed');});
 it('rejects mainnet recipients, zero and values above one test NEAR',()=>{const draft={id:crypto.randomUUID(),reference:'TEST-1',receiver:invoice.receiver,amount:'0.01',description:''};expect(testnetInvoiceDraft.parse(draft)).toEqual(draft);for(const change of [{receiver:'supplier.near'},{amount:'0'},{amount:'2'}])expect(testnetInvoiceDraft.safeParse({...draft,...change}).success).toBe(false);});
});
it('bounds a stalled load without accepting a late result',async()=>{vi.useFakeTimers();let resolve!:(v:string)=>void;const work=new Promise<string>(r=>{resolve=r;});const checked=expect(withDeadline(work,100,'timed out')).rejects.toThrow('timed out');await vi.advanceTimersByTimeAsync(101);await checked;resolve('late');vi.useRealTimers();});
