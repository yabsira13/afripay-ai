import {describe,it,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
import {PDFDocument} from 'pdf-lib';
import {createDemoReceipt,receiptAmount} from '../lib/receipt';
import type {Payment} from '../lib/types';
const fonts=Promise.all(['DejaVuSans.ttf','DejaVuSans-Bold.ttf','DejaVuSansMono.ttf'].map(name=>readFile(new URL('../public/fonts/'+name,import.meta.url)))).then(([regular,bold,mono])=>({regular,bold,mono}));
const payment:Payment={id:'receipt-test-1',supplier:'Shenzhen Nova Trading',amount:'200',asset:'USDC',recipient:'0x4a6b9f3d82e150c769a205d18f3b47c9e602a8d1',chain:'base',status:'Settled (demo)',createdAt:'2026-11-05T08:49:00.299Z',mode:'demo',risk:{score:0,level:'Low',evidence:[],recommendation:'Confirm details.',blocked:false},receipt:'DEMO-receipt-test-1'};
describe('Professional demo receipt',()=>{
 it('creates a valid single-page PDF clearly identified as a simulation',async()=>{const bytes=await createDemoReceipt(payment,{business:'Addis Coffee Export',invoiceNumber:'INV-TEST-002'},await fonts);expect(new TextDecoder().decode(bytes.slice(0,5))).toBe('%PDF-');const doc=await PDFDocument.load(bytes);expect(doc.getPageCount()).toBe(1);expect(doc.getTitle()).toContain('Demo payment receipt');expect(doc.getSubject()).toContain('Not proof of a blockchain payment');});
 it.each(['Processing (demo)','Failed (demo)','Refunded (demo)','Pending approval'] as const)('does not issue a settlement receipt for %s',async status=>{await expect(createDemoReceipt({...payment,status},{business:'Test'},await fonts)).rejects.toThrow(/only for settled demo payments/);});
 it('rejects a mismatched receipt reference',async()=>{await expect(createDemoReceipt({...payment,receipt:'DEMO-another-payment'},{business:'Test'},await fonts)).rejects.toThrow(/does not match/);});
 it('rejects non-demo records even if cast by a caller',async()=>{await expect(createDemoReceipt({...payment,mode:'live' as 'demo'},{business:'Test'},await fonts)).rejects.toThrow(/only for settled demo payments/);});
 it('retains precision for large values and fractional tokens',()=>{expect(receiptAmount('9007199254740993.123456')).toBe('9,007,199,254,740,993.123456');expect(receiptAmount('0.000000000000000000000001')).toBe('0.000000000000000000000001');expect(receiptAmount('200')).toBe('200.00');});
 it('rejects invalid and zero amounts',()=>{for(const amount of ['0','0.000','NaN','-200','1e4'])expect(()=>receiptAmount(amount)).toThrow();});
 it('wraps long international names onto continuation pages',async()=>{const bytes=await createDemoReceipt({...payment,supplier:'Société internationale de coopération '.repeat(20)},{business:'Addis Coffee Export'},await fonts);expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(1);});
});
