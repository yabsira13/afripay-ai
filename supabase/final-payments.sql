-- AFRIPAY 0.6: additive upgrade; preserves all existing balances and transfers.
-- Run AFTER account-profiles.sql, supplier-marketplace.sql, workspace-sync.sql,
-- and demo-accounts-feedback.sql. DUSD remains valueless test credit.
begin;
alter table public.demo_credit_accounts add column if not exists display_name text not null default '' check(length(display_name)<=100);
alter table public.demo_credit_transfers add column if not exists purpose text not null default 'friend' check(purpose in('friend','supplier'));
alter table public.demo_credit_transfers add column if not exists supplier_application_id uuid references public.supplier_applications(id);
alter table public.demo_credit_transfers add column if not exists invoice_id text;
alter table public.demo_credit_transfers add column if not exists invoice_number text;
alter table public.demo_credit_transfers add column if not exists sender_label text;
alter table public.demo_credit_transfers add column if not exists recipient_label text;
update public.demo_credit_transfers t set sender_label=coalesce(t.sender_label,coalesce(nullif(a.display_name,''),'Account '||left(a.receive_code::text,8)))from public.demo_credit_accounts a where a.user_id=t.sender_id and t.sender_label is null;
update public.demo_credit_transfers t set recipient_label=coalesce(t.recipient_label,coalesce(nullif(a.display_name,''),'Account '||left(a.receive_code::text,8)))from public.demo_credit_accounts a where a.user_id=t.recipient_id and t.recipient_label is null;
alter table public.demo_credit_transfers alter column sender_label set not null;
alter table public.demo_credit_transfers alter column recipient_label set not null;
create unique index if not exists one_credit_supplier_invoice on public.demo_credit_transfers(sender_id,supplier_application_id,lower(trim(invoice_number))) where purpose='supplier' and invoice_number is not null;

create or replace function public.afripay_set_credit_name(p_name text) returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 if p_name is null or length(trim(p_name))not between 2 and 100 or p_name~'[[:cntrl:]]' then raise exception 'Enter a receipt display name between 2 and 100 characters';end if;
 perform public.afripay_open_demo_credit_account();
 update public.demo_credit_accounts set display_name=trim(p_name)where user_id=auth.uid();
end$$;
create or replace function public.afripay_preview_credit_recipient(p_code uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare a public.demo_credit_accounts;begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 select * into a from public.demo_credit_accounts where receive_code=p_code;
 if not found then raise exception 'Recipient code not found';end if;
 if a.user_id=auth.uid() then raise exception 'Choose a different recipient account';end if;
 return jsonb_build_object('receive_code',a.receive_code,'label',coalesce(nullif(a.display_name,''),'Account '||left(a.receive_code::text,8)));
end$$;

-- Internal coordinator: no direct authenticated/anonymous execution grant.
create or replace function public.afripay_record_credit(p_recipient uuid,p_amount bigint,p_request uuid,p_purpose text,p_supplier uuid default null,p_invoice text default null,p_number text default null,p_recipient_label text default null)
returns public.demo_credit_transfers language plpgsql security definer set search_path=public,pg_temp as $$
declare sender uuid:=auth.uid();prior public.demo_credit_transfers;spent bigint;sender_name text;recipient_name text;policy jsonb;
begin
 if sender is null then raise exception 'Sign in required';end if;
 if p_request is null or p_amount is null or p_amount not between 1 and 100000 or p_purpose not in('friend','supplier')then raise exception 'Enter between 0.01 and 1000 DUSD';end if;
 if p_recipient=sender then raise exception 'Choose a different recipient account';end if;
 if not exists(select 1 from public.demo_credit_accounts where user_id=sender)or not exists(select 1 from public.demo_credit_accounts where user_id=p_recipient)then raise exception 'Both accounts must open their demo credits first';end if;
 perform 1 from public.demo_credit_accounts where user_id in(sender,p_recipient)order by user_id for update;
 select * into prior from public.demo_credit_transfers where sender_id=sender and request_id=p_request;
 if found then
  if prior.recipient_id<>p_recipient or prior.amount_atomic<>p_amount or prior.purpose<>p_purpose or prior.supplier_application_id is distinct from p_supplier or prior.invoice_id is distinct from p_invoice then raise exception 'This approval ID was already used for different details';end if;
  return prior;
 end if;
 select coalesce(sum(amount_atomic),0)into spent from public.demo_credit_transfers where sender_id=sender and created_at>=(date_trunc('day',now() at time zone 'UTC')at time zone 'UTC');
 select snapshot->'policy' into policy from public.demo_workspaces where user_id=sender;
 if policy is not null and(p_amount>coalesce((policy->>'singleLimit')::numeric,1000)*100 or spent+p_amount>coalesce((policy->>'dailyLimit')::numeric,5000)*100)then raise exception 'Saved spending policy would be exceeded';end if;
 if spent+p_amount>500000 then raise exception 'Daily demo credit limit exceeded (5000 DUSD)';end if;
 if(select balance_atomic from public.demo_credit_accounts where user_id=sender)<p_amount then raise exception 'Insufficient demo credits';end if;
 select coalesce(nullif(display_name,''),'Account '||left(receive_code::text,8))into sender_name from public.demo_credit_accounts where user_id=sender;
 select coalesce(p_recipient_label,nullif(display_name,''),'Account '||left(receive_code::text,8))into recipient_name from public.demo_credit_accounts where user_id=p_recipient;
 update public.demo_credit_accounts set balance_atomic=balance_atomic-p_amount where user_id=sender;
 update public.demo_credit_accounts set balance_atomic=balance_atomic+p_amount where user_id=p_recipient;
 insert into public.demo_credit_transfers(request_id,sender_id,recipient_id,amount_atomic,purpose,supplier_application_id,invoice_id,invoice_number,sender_label,recipient_label)
 values(p_request,sender,p_recipient,p_amount,p_purpose,p_supplier,p_invoice,p_number,sender_name,recipient_name)returning * into prior;
 insert into public.demo_credit_entries(user_id,transfer_id,kind,amount_atomic)values(sender,prior.id,'sent',-p_amount),(p_recipient,prior.id,'received',p_amount);
 return prior;
end$$;
revoke all on function public.afripay_record_credit(uuid,bigint,uuid,text,uuid,text,text,text) from public,anon,authenticated;
create or replace function public.afripay_transfer_demo_credits(p_recipient_code uuid,p_amount_atomic bigint,p_request_id uuid)
returns setof public.demo_credit_transfers language plpgsql security definer set search_path=public,pg_temp as $$declare recipient uuid;item public.demo_credit_transfers;begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 select user_id into recipient from public.demo_credit_accounts where receive_code=p_recipient_code;
 if recipient is null then raise exception 'Recipient code not found. Ask them to open Receive first.';end if;
 perform 1 from public.demo_workspaces where user_id=auth.uid()for share;
 item=public.afripay_record_credit(recipient,p_amount_atomic,p_request_id,'friend');return next item;
end$$;
create or replace function public.afripay_credit_supplier_directory()returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'business_name',s.business_name,'wallet',s.wallet,'chain',s.chain,'updated_at',s.updated_at,'can_receive',a.user_id is not null)order by s.business_name)from public.supplier_applications s left join public.demo_credit_accounts a on a.user_id=s.owner_id where s.status='approved'and s.wallet_verified_at is not null and s.owner_id<>auth.uid()),'[]'::jsonb);
end$$;
create or replace function public.afripay_pay_credit_supplier(p_application_id uuid,p_amount_atomic bigint,p_request_id uuid,p_expected_updated_at timestamptz,p_invoice_id text default null,p_expected_revision integer default null,p_reviewed boolean default false)
returns setof public.demo_credit_transfers language plpgsql security definer set search_path=public,pg_temp as $$
declare seller public.supplier_applications;doc public.demo_workspaces;inv jsonb;item public.demo_credit_transfers;position integer;v_number text;paid_already public.demo_credit_transfers;
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 -- Serialize retries on this account's document BEFORE invoice/duplicate checks.
 select * into doc from public.demo_workspaces where user_id=auth.uid()for update;
 select * into paid_already from public.demo_credit_transfers where sender_id=auth.uid()and request_id=p_request_id;
 if found then
  if paid_already.purpose<>'supplier'or paid_already.supplier_application_id is distinct from p_application_id or paid_already.amount_atomic is distinct from p_amount_atomic or paid_already.invoice_id is distinct from nullif(p_invoice_id,'')then raise exception 'This approval ID was already used for different details';end if;
  return next paid_already;return;
 end if;
 select * into seller from public.supplier_applications where id=p_application_id for share;
 if not found or seller.status<>'approved'or seller.wallet_verified_at is null then raise exception 'Select a currently approved supplier';end if;
 if seller.updated_at is distinct from p_expected_updated_at then raise exception 'Supplier details changed. Reload and review again.';end if;
 if not coalesce(p_reviewed,false)then raise exception 'Explicit recipient and amount review required';end if;
 if not exists(select 1 from public.demo_credit_accounts where user_id=seller.owner_id)then raise exception 'Supplier must open Receive to activate their demo credit account';end if;
 if doc.user_id is not null and (p_amount_atomic>coalesce((doc.snapshot->'policy'->>'singleLimit')::numeric,1000)*100 or p_amount_atomic+(select coalesce(sum(amount_atomic),0)from public.demo_credit_transfers where sender_id=auth.uid() and created_at>=(date_trunc('day',now() at time zone 'UTC')at time zone 'UTC'))>coalesce((doc.snapshot->'policy'->>'dailyLimit')::numeric,5000)*100)then raise exception 'Saved spending policy would be exceeded';end if;
 if nullif(p_invoice_id,'')is not null then
  if doc.user_id is null or doc.revision is distinct from p_expected_revision then raise exception 'Invoice workspace changed. Wait for cloud saving and review again.';end if;
  select value,(ordinality-1)::integer into inv,position from jsonb_array_elements(doc.snapshot->'invoices')with ordinality where value->>'id'=p_invoice_id;
  if inv is null or inv->>'verified' is distinct from 'true'or inv->>'status'='Paid (demo)'then raise exception 'Review and independently verify an unpaid invoice first';end if;
  if lower(trim(inv->>'supplier'))is distinct from lower(trim(seller.business_name))or inv->>'chain' is distinct from seller.chain or(case when seller.chain in('base','eth','arb')then lower(inv->>'wallet')else inv->>'wallet'end)is distinct from(case when seller.chain in('base','eth','arb')then lower(seller.wallet)else seller.wallet end)then raise exception 'Invoice supplier or destination differs from the approved supplier';end if;
  if coalesce(inv->>'currency','')not in('USD','USDC','USDT','DUSD')or coalesce(inv->>'amount','')!~'^\d+(\.\d{1,2})?$'or(inv->>'amount')::numeric*100 is distinct from p_amount_atomic::numeric then raise exception 'Invoice amount/asset does not match this DUSD simulation';end if;
  v_number=trim(inv->>'number');if coalesce(v_number,'')=''then raise exception 'Invoice number is required';end if;
  if coalesce(inv->>'text','')~*'(ignore|bypass|override).{0,60}(security|verif|approv|previous|system|developer)|(mark|set).{0,40}(verified|approved|risk[[:space:]]*(score)?[[:space:]]*(to|=|:)[[:space:]]*0)|seed phrase|private key|urgent.{0,30}new (wallet|account)'then raise exception 'Invoice instructions require independent security review before payment';end if;
  if exists(select 1 from public.demo_credit_transfers where sender_id=auth.uid()and supplier_application_id=seller.id and lower(trim(demo_credit_transfers.invoice_number))=lower(v_number))then raise exception 'This supplier invoice already has a recorded payment';end if;
  if exists(select 1 from jsonb_array_elements(doc.snapshot->'payments')p where p->>'invoiceId'=p_invoice_id and p->>'status'in('Processing (demo)','Settled (demo)'))then raise exception 'This invoice already has a processing or settled preview; review its history first';end if;
  if p_amount_atomic>coalesce((doc.snapshot->'policy'->>'singleLimit')::numeric,1000)*100 then raise exception 'Invoice exceeds the saved per-payment policy';end if;
 end if;
 item=public.afripay_record_credit(seller.owner_id,p_amount_atomic,p_request_id,'supplier',seller.id,nullif(p_invoice_id,''),v_number,seller.business_name);
 if inv is not null then
  inv=jsonb_set(jsonb_set(inv,'{status}','"Paid (demo)"'::jsonb),'{creditTransferId}',to_jsonb(item.id::text));
  update public.demo_workspaces set snapshot=jsonb_set(snapshot,array['invoices',position::text],inv),revision=revision+1,updated_at=now()where user_id=auth.uid();
 end if;
 return next item;
end$$;
create or replace function public.afripay_credit_summary()returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 perform public.afripay_open_demo_credit_account();
 return (select jsonb_build_object('schema_version',2,'account',to_jsonb(a),'received_atomic',(select coalesce(sum(amount_atomic),0)::text from public.demo_credit_transfers where recipient_id=auth.uid()),'sent_atomic',(select coalesce(sum(amount_atomic),0)::text from public.demo_credit_transfers where sender_id=auth.uid()),'transfers',coalesce((select jsonb_agg(to_jsonb(t)order by t.created_at desc)from(select * from public.demo_credit_transfers where sender_id=auth.uid()or recipient_id=auth.uid()order by created_at desc limit 100)t),'[]'::jsonb)) from public.demo_credit_accounts a where a.user_id=auth.uid());
end$$;
create or replace function public.afripay_get_credit_receipt(p_transfer_id uuid)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare t public.demo_credit_transfers;begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 select * into t from public.demo_credit_transfers where id=p_transfer_id and(sender_id=auth.uid()or recipient_id=auth.uid());
 if not found then raise exception 'Receipt not found or access denied';end if;
 return jsonb_build_object('reference','DUSD-'||t.id::text,'transfer_id',t.id,'sender',t.sender_label,'recipient',t.recipient_label,'amount_atomic',t.amount_atomic,'asset','DUSD','purpose',t.purpose,'invoice_number',t.invoice_number,'created_at',t.created_at,'status','Recorded','notice','DEMO CREDITS — NO REAL FUNDS MOVED');
end$$;
revoke all on function public.afripay_set_credit_name(text),public.afripay_preview_credit_recipient(uuid),public.afripay_credit_supplier_directory(),public.afripay_pay_credit_supplier(uuid,bigint,uuid,timestamptz,text,integer,boolean),public.afripay_credit_summary(),public.afripay_get_credit_receipt(uuid)from public,anon;
grant execute on function public.afripay_set_credit_name(text),public.afripay_preview_credit_recipient(uuid),public.afripay_credit_supplier_directory(),public.afripay_pay_credit_supplier(uuid,bigint,uuid,timestamptz,text,integer,boolean),public.afripay_credit_summary(),public.afripay_get_credit_receipt(uuid)to authenticated;
commit;
