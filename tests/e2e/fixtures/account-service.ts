import {expect,type Page} from '@playwright/test';
import {seed} from '../../../lib/seed';
import type {DemoInvoice} from '../../../lib/demo-invoices';
import type {CreditAccount,CreditTransfer} from '../../../lib/demo-credits';
const url='https://afripay-test.supabase.co',key='sb_publishable_abcdefghijklmnopqrstuv';
export const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',ADMIN='33333333-3333-4333-8333-333333333333';
const user=(id:string,email=id===ADMIN?'admin@example.com':id===A?'alice@example.com':'bob@example.com')=>({id,email,aud:'authenticated',role:'authenticated',app_metadata:{provider:'email',providers:['email']},user_metadata:{full_name:id===A?'Alice User':'Bob User'},created_at:'2026-11-06T00:00:00Z',identities:[{id,provider:'email'}]});
export function token(id:string){return Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:id,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.testsignature';}
function owner(header:string|undefined){try{return JSON.parse(Buffer.from((header||'').split('.')[1],'base64url').toString()).sub;}catch{return null;}}
/** Mock service exercises the real browser SDK; database authorization is tested separately in PostgreSQL. */
export type SharedDemoState={creditAccounts:Map<string,CreditAccount>;creditTransfers:CreditTransfer[];demoInvoices:Map<string,DemoInvoice>};
export async function service(page:Page,shared?:SharedDemoState){
 const records=new Map<string,{snapshot:ReturnType<typeof seed>;revision:number}>();
 const requests:string[]=[];
 const creditAccounts=shared?.creditAccounts||new Map<string,CreditAccount>();
 const creditTransfers:CreditTransfer[]=shared?.creditTransfers||[];
 const demoInvoices=shared?.demoInvoices||new Map<string,DemoInvoice>();
 const suppliers:{id:string;owner_id:string;business_name:string;wallet:string;chain:string;updated_at:string}[]=[];
 const faults={loseNextTransferResponse:false,loseNextInvoiceResponse:false,loseNextInvoicePaymentResponse:false};
 function ensure(id:string){if(!creditAccounts.has(id))creditAccounts.set(id,{user_id:id,receive_code:id===A?'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa':'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',balance_atomic:0,faucet_claimed:false,display_name:''});return creditAccounts.get(id)!;}
 function label(id:string){const a=ensure(id);return a.display_name||'Account '+a.receive_code.slice(0,8);}
 const feedback:{user_id:string;category:string;message:string;id:string;created_at:string}[]=[];
 let currentPassword='ValidPassword123!';
 await page.route('**/api/config',route=>route.fulfill({json:{authConfigured:true,supabase:{url,publishableKey:key},authSetupIssue:''}}));
 await page.route(url+'/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname,id=owner(request.headers().authorization);requests.push(path);
  if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'}});
  if(path==='/auth/v1/token'){
   const body=request.postDataJSON(),id=body.email==='admin@example.com'?ADMIN:body.email==='bob@example.com'?B:A;
   if(body.password!==currentPassword)return route.fulfill({status:400,json:{code:'invalid_credentials',msg:'Invalid login credentials'}});
   return route.fulfill({json:{access_token:token(id),refresh_token:'refresh-'+id,token_type:'bearer',expires_in:3600,user:user(id)}});
  }
  if(path==='/auth/v1/signup')return route.fulfill({json:user(A,request.postDataJSON().email)});
  if(path==='/auth/v1/logout')return route.fulfill({status:204});
  if(path==='/auth/v1/recover')return route.fulfill({json:{}});
  if(path==='/auth/v1/user'){if(request.method()==='PUT')currentPassword=request.postDataJSON().password;return route.fulfill({json:user(id||A)});}
  if(path==='/rest/v1/rpc/afripay_is_admin')return route.fulfill({json:id===ADMIN});
  if(path==='/rest/v1/account_profiles')return route.fulfill({json:[{user_id:id,full_name:id===A?'Alice User':'Bob User',business_name:id===A?'Alice Trading':'Bob Trading',country:'Ethiopia',account_type:'customer',reporting_currency:'USD',onboarding_completed:true}]});
  if(path==='/rest/v1/demo_workspaces')return route.fulfill({json:records.has(id)?[records.get(id)]:[]});
  if(path==='/rest/v1/rpc/afripay_save_demo_workspace'){
   const body=request.postDataJSON(),old=records.get(id);
   if(body.p_expected_revision!==(old?.revision||0))return route.fulfill({status:409,json:{code:'40001',message:'Workspace revision conflict'}});
   const record={snapshot:body.p_snapshot,revision:(old?.revision||0)+1};records.set(id,record);return route.fulfill({json:[record]});
  }
  if(path==='/rest/v1/supplier_applications')return route.fulfill({json:[]});
  if(path==='/rest/v1/demo_credit_accounts')return route.fulfill({json:creditAccounts.has(id)?[creditAccounts.get(id)]:[]});
  if(path==='/rest/v1/demo_credit_transfers')return route.fulfill({json:creditTransfers.filter(t=>t.sender_id===id||t.recipient_id===id)});
  if(path==='/rest/v1/rpc/afripay_demo_invoice_inbox')return route.fulfill({json:{invoices:[...demoInvoices.values()].filter(i=>i.issuer_id===id||i.payer_id===id).sort((a,b)=>b.created_at.localeCompare(a.created_at))}});
  if(path==='/rest/v1/demo_invoice_requests'){const invoice=demoInvoices.get(new URL(request.url()).searchParams.get('id')?.replace('eq.','')||'');return invoice&&(invoice.issuer_id===id||invoice.payer_id===id)?route.fulfill({json:invoice}):route.fulfill({status:403,json:{message:'Invoice access denied'}});}
  if(path==='/rest/v1/rpc/afripay_create_demo_invoice'){
   const b=request.postDataJSON(),payer=[...creditAccounts.values()].find(a=>a.receive_code===b.p_payer_code);if(!payer||payer.user_id===id||!b.p_confirmed)return route.fulfill({status:400,json:{code:'P0001',message:'Review the customer account'}});
   const prior=demoInvoices.get(b.p_id);if(prior)return route.fulfill({json:prior});
   if([...demoInvoices.values()].some(i=>i.issuer_id===id&&i.reference.toLowerCase()===b.p_reference.trim().toLowerCase()))return route.fulfill({status:409,json:{code:'P0001',message:'Invoice reference already used'}});
   const account=ensure(id);const invoice:DemoInvoice={id:b.p_id,issuer_id:id,payer_id:payer.user_id,issuer_code:account.receive_code,payer_code:payer.receive_code,issuer_label:label(id),payer_label:label(payer.user_id),reference:b.p_reference.trim(),amount_atomic:b.p_amount_atomic,description:b.p_description,state:'OPEN',transfer_id:null,created_at:new Date().toISOString(),paid_at:null};demoInvoices.set(invoice.id,invoice);
   if(faults.loseNextInvoiceResponse){faults.loseNextInvoiceResponse=false;return route.fulfill({status:503,json:{message:'Invoice response temporarily unavailable'}});}return route.fulfill({json:invoice});
  }
  if(path==='/rest/v1/rpc/afripay_pay_demo_invoice'){
   const b=request.postDataJSON(),invoice=demoInvoices.get(b.p_invoice_id);if(!invoice||invoice.payer_id!==id||!b.p_confirmed)return route.fulfill({status:403,json:{code:'P0001',message:'Invoice access denied'}});if(invoice.state==='PAID')return route.fulfill({json:invoice});const payer=ensure(id),issuer=ensure(invoice.issuer_id);if(invoice.state!=='OPEN'||payer.balance_atomic<invoice.amount_atomic)return route.fulfill({status:409,json:{code:'P0001',message:'Invoice unavailable or insufficient demo credits'}});
   const transfer:CreditTransfer={id:b.p_request_id,sender_id:id,recipient_id:issuer.user_id,amount_atomic:invoice.amount_atomic,created_at:new Date().toISOString(),purpose:'friend',sender_label:label(id),recipient_label:label(issuer.user_id),invoice_id:'demo-inbox:'+invoice.id,invoice_number:invoice.reference};payer.balance_atomic-=invoice.amount_atomic;issuer.balance_atomic+=invoice.amount_atomic;creditTransfers.unshift(transfer);invoice.state='PAID';invoice.transfer_id=transfer.id;invoice.paid_at=transfer.created_at;
   if(faults.loseNextInvoicePaymentResponse){faults.loseNextInvoicePaymentResponse=false;return route.fulfill({status:503,json:{message:'Payment response temporarily unavailable'}});}return route.fulfill({json:invoice});
  }
  if(path==='/rest/v1/rpc/afripay_cancel_demo_invoice'){const invoice=demoInvoices.get(request.postDataJSON().p_invoice_id);if(!invoice||invoice.issuer_id!==id||invoice.state==='PAID')return route.fulfill({status:409,json:{code:'P0001',message:'Cannot cancel invoice'}});invoice.state='CANCELLED';return route.fulfill({json:invoice});}
  if(path==='/rest/v1/rpc/afripay_open_demo_credit_account')return route.fulfill({json:[ensure(id)]});
  if(path==='/rest/v1/rpc/afripay_credit_summary')return route.fulfill({json:{schema_version:2,account:ensure(id),received_atomic:String(creditTransfers.filter(t=>t.recipient_id===id).reduce((v,t)=>v+t.amount_atomic,0)),sent_atomic:String(creditTransfers.filter(t=>t.sender_id===id).reduce((v,t)=>v+t.amount_atomic,0)),transfers:creditTransfers.filter(t=>t.sender_id===id||t.recipient_id===id)}});
  if(path==='/rest/v1/rpc/afripay_set_credit_name'){ensure(id).display_name=request.postDataJSON().p_name.trim();return route.fulfill({json:null});}
  if(path==='/rest/v1/rpc/afripay_preview_credit_recipient'){const a=[...creditAccounts.values()].find(a=>a.receive_code===request.postDataJSON().p_code&&a.user_id!==id);return a?route.fulfill({json:{receive_code:a.receive_code,label:label(a.user_id)}}):route.fulfill({status:400,json:{code:'P0001',message:'Recipient code not found'}});}
  if(path==='/rest/v1/rpc/afripay_credit_supplier_directory')return route.fulfill({json:suppliers.filter(s=>s.owner_id!==id).map(s=>({...s,can_receive:creditAccounts.has(s.owner_id)}))});
  if(path==='/rest/v1/rpc/afripay_claim_demo_credits'){const account=ensure(id);if(account.faucet_claimed)return route.fulfill({status:400,json:{code:'P0001',message:'Already claimed'}});account.balance_atomic+=100000;account.faucet_claimed=true;return route.fulfill({json:[account]});}
  if(path==='/rest/v1/rpc/afripay_get_credit_receipt'){const t=creditTransfers.find(t=>t.id===request.postDataJSON().p_transfer_id&&(t.sender_id===id||t.recipient_id===id));return t?route.fulfill({json:{reference:'DUSD-'+t.id,transfer_id:t.id,sender:t.sender_label,recipient:t.recipient_label,amount_atomic:t.amount_atomic,asset:'DUSD',purpose:t.purpose||'friend',invoice_number:t.invoice_number||null,created_at:t.created_at,status:'Recorded',notice:'DEMO CREDITS — NO REAL FUNDS MOVED'}}):route.fulfill({status:403,json:{code:'P0001',message:'Receipt access denied'}});}
  if(path==='/rest/v1/rpc/afripay_transfer_demo_credits'||path==='/rest/v1/rpc/afripay_pay_credit_supplier'){
   const body=request.postDataJSON(),account=ensure(id),supplier=suppliers.find(s=>s.id===body.p_application_id),recipient=supplier?ensure(supplier.owner_id):[...creditAccounts.values()].find(a=>a.receive_code===body.p_recipient_code);
   const prior=creditTransfers.find(t=>t.id===body.p_request_id&&t.sender_id===id);if(prior)return route.fulfill({json:[prior]});
   if(!recipient||body.p_amount_atomic>account.balance_atomic||body.p_amount_atomic<=0)return route.fulfill({status:400,json:{code:'P0001',message:'Invalid recipient or insufficient demo credits'}});
   if(supplier&&supplier.updated_at!==body.p_expected_updated_at)return route.fulfill({status:400,json:{code:'P0001',message:'Supplier details changed. Review again.'}});
   const record=records.get(id),invoice=record?.snapshot.invoices.find(i=>i.id===body.p_invoice_id);
   if(body.p_invoice_id&&(!record||!invoice||!invoice.verified||record.revision!==body.p_expected_revision))return route.fulfill({status:400,json:{code:'P0001',message:'Invoice workspace changed. Review again.'}});
   account.balance_atomic-=body.p_amount_atomic;recipient.balance_atomic+=body.p_amount_atomic;
   const transfer:CreditTransfer={id:body.p_request_id,sender_id:id,recipient_id:recipient.user_id,amount_atomic:body.p_amount_atomic,created_at:new Date().toISOString(),purpose:supplier?'supplier':'friend',sender_label:label(id),recipient_label:supplier?.business_name||label(recipient.user_id),invoice_id:body.p_invoice_id||null,invoice_number:invoice?.number||null};creditTransfers.unshift(transfer);
   if(invoice&&record){invoice.status='Paid (demo)';invoice.creditTransferId=transfer.id;record.revision++;}
   if(faults.loseNextTransferResponse){faults.loseNextTransferResponse=false;return route.fulfill({status:503,json:{message:'Response temporarily unavailable'}});}
   return route.fulfill({json:[transfer]});
  }
  if(path==='/rest/v1/product_feedback'){if(request.method()==='POST'){feedback.push({...request.postDataJSON(),id:'feedback-'+feedback.length,created_at:new Date().toISOString()});return route.fulfill({status:201,json:{}});}return route.fulfill({json:feedback.filter(f=>f.user_id===id||id===ADMIN)});}
  return route.fulfill({status:404,json:{message:'Mock route not implemented'}});
 });
 return {records,requests,creditAccounts,creditTransfers,feedback,suppliers,faults,demoInvoices};
}
export async function signin(page:Page,email='alice@example.com'){
 await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill('ValidPassword123!');await page.getByRole('button',{name:'Sign in',exact:true}).last().click();await expect(page.getByText(/Simulation saved privately in Supabase/)).toBeVisible();
}
