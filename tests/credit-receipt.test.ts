import {describe,it,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
import {PDFDocument} from 'pdf-lib';
import {createCreditReceipt} from '../lib/credit-receipt';
import {creditReceiptSchema,creditSummarySchema,displayCredits,type CreditReceipt} from '../lib/demo-credits';
const id='44444444-4444-4444-8444-444444444444';
const receipt:CreditReceipt={transfer_id:id,reference:'DUSD-'+id,sender:'Alice Export',recipient:'Bob Studio',amount_atomic:20000,asset:'DUSD',purpose:'friend',invoice_number:null,created_at:'2026-11-06T10:00:00Z',status:'Recorded',notice:'DEMO CREDITS — NO REAL FUNDS MOVED'};
describe('Professional DUSD receipts',()=>{
 it('rejects malformed totals and unsupported monetary claims before rendering',()=>{expect(creditSummarySchema.safeParse({schema_version:2,account:{user_id:id,receive_code:id,balance_atomic:-10,faucet_claimed:true},received_atomic:'Infinity',sent_atomic:'NaN',transfers:[]}).success).toBe(false);});
 it('rejects altered references or real-money asset claims',()=>{expect(creditReceiptSchema.safeParse({...receipt,reference:'DUSD-other'}).success).toBe(false);expect(creditReceiptSchema.safeParse({...receipt,asset:'USDC'}).success).toBe(false);});
 it('generates a valid PDF with explicit demo metadata',async()=>{const [regular,bold,mono]=await Promise.all(['DejaVuSans.ttf','DejaVuSans-Bold.ttf','DejaVuSansMono.ttf'].map(n=>readFile(new URL('../public/fonts/'+n,import.meta.url))));const bytes=await createCreditReceipt(receipt,{regular,bold,mono});const doc=await PDFDocument.load(bytes);expect(doc.getTitle()).toContain('Demo credit receipt');expect(doc.getSubject()).toContain('No real funds');expect(doc.getPageCount()).toBeGreaterThan(0);});
 it('formats integer lifetime totals without losing precision',()=>{expect(displayCredits('900719925474099301')).toBe('9,007,199,254,740,993.01');});
});
