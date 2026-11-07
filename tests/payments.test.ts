import {describe,it,expect} from 'vitest';
import {seed} from '../lib/seed';
import {approveDemoPayment,assessPayment,settleDemoPayment} from '../lib/payments';
const now=Date.parse('2026-11-04T12:00:00Z');
const input={supplier:'Shenzhen Nova Trading',amount:'200',asset:'USDC',recipient:seed().suppliers[0].wallet,chain:'base',invoiceId:'invoice-demo-1'};
const approval={confirmed:true,reviewed:false,quoteTime:now,quoteMode:'demo'};
function workspace(){const data=seed();data.invoices[0].verified=true;return data;}
describe('Invoice-to-payment lifecycle',()=>{
 it('blocks a new preview for an invoice already paid through the credit ledger',()=>{const data=workspace();data.invoices[0].status='Paid (demo)';data.invoices[0].creditTransferId='recorded-credit-transfer';expect(assessPayment(data,input,now).blocked).toBe(true);expect(()=>approveDemoPayment(data,input,approval,'another-preview',now)).toThrow(/blocked/);});
 it('updates only the linked invoice after explicit demo settlement',()=>{const data=workspace();const created=approveDemoPayment(data,input,approval,'payment-1',now);expect(created.invoices[0].status).toBe('Needs review');expect(created.payments[0].mode).toBe('demo');const settled=settleDemoPayment(created,'payment-1','Settled (demo)',now);expect(settled.invoices[0].status).toBe('Paid (demo)');expect(settled.invoices[1].status).toBe(data.invoices[1].status);expect(settled.payments[0].receipt).toBe('DEMO-payment-1');expect(settled.payments[0]).not.toHaveProperty('txHash');});
 it.each(['Failed (demo)','Refunded (demo)'] as const)('%s keeps the invoice unpaid and permits a retry',outcome=>{const created=approveDemoPayment(workspace(),input,approval,'payment-1',now);const result=settleDemoPayment(created,'payment-1',outcome,now);expect(result.invoices[0].status).toBe('Needs review');expect(result.payments[0].receipt).toBeUndefined();expect(()=>approveDemoPayment(result,input,approval,'payment-2',now)).not.toThrow();});
 it('rejects repeated approvals against updated state',()=>{const created=approveDemoPayment(workspace(),input,approval,'payment-1',now);expect(()=>approveDemoPayment(created,input,approval,'payment-2',now)).toThrow(/blocked/);});
 it('does not permit reversing a terminal outcome through the demo controls',()=>{const settled=settleDemoPayment(approveDemoPayment(workspace(),input,approval,'payment-1',now),'payment-1','Settled (demo)',now);expect(()=>settleDemoPayment(settled,'payment-1','Failed (demo)',now)).toThrow();});
 it('requires recipient verification and explicit approval',()=>{expect(()=>approveDemoPayment(seed(),input,approval,'payment-1',now)).toThrow(/Verify/);expect(()=>approveDemoPayment(workspace(),input,{...approval,confirmed:false},'payment-1',now)).toThrow(/Confirm/);});
 it('rejects expired and future-dated approvals',()=>{for(const quoteTime of [now-180001,now+1,0])expect(()=>approveDemoPayment(workspace(),input,{...approval,quoteTime},'payment-1',now)).toThrow(/quote expired/);});
 it('cannot use a live dry quote for funding',()=>{expect(()=>approveDemoPayment(workspace(),input,{...approval,quoteMode:'live'},'payment-1',now)).toThrow(/Live funding is disabled/);});
 it('binds the proposal to reviewed invoice amount, supplier, asset and recipient',()=>{for(const modified of [{amount:'201'},{supplier:'Changed supplier'},{asset:'USDT'},{recipient:seed().suppliers[2].wallet},{chain:'eth'}])expect(assessPayment(workspace(),{...input,...modified},now).blocked).toBe(true);});
 it('blocks the same supplier invoice imported under a different record ID',()=>{const data=workspace();data.invoices.push({...data.invoices[0],id:'duplicate-import'});const created=approveDemoPayment(data,input,approval,'payment-1',now);expect(assessPayment(created,{...input,invoiceId:'duplicate-import'},now).blocked).toBe(true);});
 it('blocks rapid repeated ad-hoc payment requests',()=>{const adHoc={...input,invoiceId:''};const created=approveDemoPayment(workspace(),adHoc,approval,'payment-1',now);expect(assessPayment(created,adHoc,now+1000).blocked).toBe(true);});
 it('blocks a duplicate disguised with different decimal formatting',()=>{const adHoc={...input,invoiceId:''};const created=approveDemoPayment(workspace(),adHoc,approval,'payment-1',now);expect(assessPayment(created,{...adHoc,amount:'0200.00'},now+1000).blocked).toBe(true);});
 it('accepts numerically identical formatting when binding to an invoice',()=>{expect(assessPayment(workspace(),{...input,amount:'200.00'},now).evidence.some(e=>e.code==='invoice_binding_mismatch')).toBe(false);});

});
