import type {Workspace,Payment,Risk} from './types';
import {analyzeInvoice,analyzeTransaction,sameAddress,score} from './security';
import {toAtomic} from './amount';
function equalAmount(a:string,b:string){try{return toAtomic(a,24)===toAtomic(b,24);}catch{return false;}}
export type PaymentForm={supplier:string;amount:string;asset:string;recipient:string;chain:string;invoiceId:string};
export function assessPayment(data:Workspace,input:PaymentForm,now=Date.now()):Risk {
 const invoice=data.invoices.find(i=>i.id===input.invoiceId);
 const invoiceRisk=invoice?analyzeInvoice(invoice,data.invoices,data.suppliers):undefined;
 const recent=data.payments.filter(p=>now-new Date(p.createdAt).getTime()<3600000);
 const today=new Date(now).toISOString().slice(0,10);
 const daily=data.payments.filter(p=>p.createdAt.slice(0,10)===today&&!p.status.startsWith('Failed')&&!p.status.startsWith('Refunded')).reduce((sum,p)=>sum+Number(p.amount),0);
 const relatedInvoiceIds=invoice?data.invoices.filter(i=>i.supplier.toLowerCase()===invoice.supplier.toLowerCase()&&i.number.trim().toLowerCase()===invoice.number.trim().toLowerCase()).map(i=>i.id):[];
 const duplicate=data.payments.some(p=>(p.status==='Processing (demo)'||p.status==='Settled (demo)')&&(input.invoiceId?!!p.invoiceId&&relatedInvoiceIds.includes(p.invoiceId):!p.invoiceId&&p.chain===input.chain&&sameAddress(p.recipient,input.recipient,input.chain)&&equalAmount(p.amount,input.amount)&&p.asset===input.asset&&now-new Date(p.createdAt).getTime()<60000));
 const risk=analyzeTransaction({amount:Number(input.amount),recipient:input.recipient,chain:input.chain,asset:input.asset,expectedAsset:invoice?.currency,expectedChain:invoice?.chain,attempts:recent.length,dailyTotal:daily,duplicate,invoiceRisk},data.suppliers,data.policy);
 if(invoice&&(invoice.status==='Paid (demo)'||invoice.creditTransferId))return score([...risk.evidence,{code:'invoice_already_paid',points:100,reason:'This invoice already has a recorded demo payment. Review its transaction history.',source:'observation'}]);
 if(invoice&&(!sameAddress(invoice.wallet,input.recipient,input.chain)||invoice.chain!==input.chain||invoice.supplier!==input.supplier||!equalAmount(invoice.amount,input.amount)||invoice.currency!==input.asset))return score([...risk.evidence,{code:'invoice_binding_mismatch',points:100,reason:'Payment details differ from the reviewed invoice. Edit and reverify the invoice before paying.',source:'observation'}]);
 return risk;
}
export function approveDemoPayment(data:Workspace,input:PaymentForm,approval:{confirmed:boolean;reviewed:boolean;quoteTime:number;quoteMode:string},id:string,now=Date.now()):Workspace {
 const risk=assessPayment(data,input,now);
 if(risk.blocked)throw new Error('Security Shield blocked this payment. Review the evidence.');
 if(!approval.confirmed)throw new Error('Confirm the recipient, amount, chain and minimum output.');
 if(risk.level==='High'&&!approval.reviewed)throw new Error('High-risk payments require an explicit manual review.');
 if(!approval.quoteTime||approval.quoteTime>now||now-approval.quoteTime>180000)throw new Error('Demo quote expired. Return to Compare routes.');
 if(approval.quoteMode!=='demo')throw new Error('Live funding is disabled. A dry quote cannot authorize a payment.');
 const invoice=data.invoices.find(i=>i.id===input.invoiceId);
 if(input.invoiceId&&(!invoice||!invoice.verified))throw new Error('Verify the invoice recipient before approval.');
 if(data.payments.some(p=>p.id===id))throw new Error('This approval has already been recorded.');
 const payment:Payment={id,invoiceId:input.invoiceId||undefined,supplier:input.supplier,amount:input.amount,asset:input.asset,recipient:input.recipient,chain:input.chain,status:'Processing (demo)',createdAt:new Date(now).toISOString(),mode:'demo',risk};
 return {...data,payments:[payment,...data.payments],audits:[{id:'audit-'+id,at:new Date(now).toISOString(),action:'Demo payment approved',detail:id,mode:'demo'},...data.audits]};
}
export function settleDemoPayment(data:Workspace,id:string,outcome:'Settled (demo)'|'Failed (demo)'|'Refunded (demo)',now=Date.now()):Workspace {
 const payment=data.payments.find(p=>p.id===id);
 if(!payment||payment.status!=='Processing (demo)')throw new Error('Only a processing demo payment can transition to an outcome.');
 return {...data,payments:data.payments.map(p=>p.id===id?{...p,status:outcome,receipt:outcome==='Settled (demo)'?'DEMO-'+id:undefined}:p),invoices:data.invoices.map(i=>i.id===payment.invoiceId&&outcome==='Settled (demo)'?{...i,status:'Paid (demo)'}:i),audits:[{id:'outcome-'+id,at:new Date(now).toISOString(),action:outcome,detail:id,mode:'demo'},...data.audits]};
}
