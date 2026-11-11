import {z} from 'zod';
export const businessInvoiceInput=z.object({id:z.uuid(),payerSupplierId:z.uuid(),invoiceReference:z.string().trim().min(1).max(100),destinationAsset:z.string().min(1).max(200),amount:z.string().regex(/^\d+(?:\.\d{1,30})?$/).max(70),invoiceText:z.string().max(2000).default(''),confirmed:z.literal(true)}).strict();
export const invoiceStatusLabel=(state:string)=>state==='PAYMENT_IN_PROGRESS'?'Processing':state==='PAID'?'Paid':state==='OPEN'?'Unpaid':state==='CANCELLED'?'Cancelled':state==='EXPIRED'?'Expired':state;
