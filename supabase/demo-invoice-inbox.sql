-- Additive Demo-only invoice delivery and atomic DUSD payment.
-- Run after final-payments.sql (or after the current complete migration set).
-- Preserves existing credits, mainnet/testnet records and uploaded previews.
begin;
create table if not exists public.demo_invoice_requests(
 id uuid primary key,
 issuer_id uuid not null references public.demo_credit_accounts(user_id),
 payer_id uuid not null references public.demo_credit_accounts(user_id),
 issuer_code uuid not null,
 payer_code uuid not null,
 issuer_label text not null check(length(issuer_label) between 1 and 160),
 payer_label text not null check(length(payer_label) between 1 and 160),
 reference text not null check(length(trim(reference)) between 1 and 100 and reference !~ '[[:cntrl:]]'),
 amount_atomic bigint not null check(amount_atomic between 1 and 100000),
 description text not null default '' check(length(description)<=2000),
 state text not null default 'OPEN' check(state in('OPEN','PAID','CANCELLED')),
 transfer_id uuid unique references public.demo_credit_transfers(id),
 created_at timestamptz not null default now(),
 paid_at timestamptz,
 check(issuer_id<>payer_id),
 check((state='PAID' and transfer_id is not null and paid_at is not null)or(state<>'PAID' and transfer_id is null and paid_at is null))
);
create unique index if not exists demo_invoice_reference_once on public.demo_invoice_requests(issuer_id,lower(trim(reference)));
create index if not exists demo_invoice_payer_time on public.demo_invoice_requests(payer_id,created_at desc);
create index if not exists demo_invoice_issuer_time on public.demo_invoice_requests(issuer_id,created_at desc);
alter table public.demo_invoice_requests enable row level security;
revoke all on public.demo_invoice_requests from public,anon,authenticated;
grant select on public.demo_invoice_requests to authenticated;
drop policy if exists demo_invoice_participants on public.demo_invoice_requests;
create policy demo_invoice_participants on public.demo_invoice_requests for select to authenticated using(issuer_id=auth.uid()or payer_id=auth.uid());

create or replace function public.afripay_create_demo_invoice(p_id uuid,p_payer_code uuid,p_reference text,p_amount_atomic bigint,p_description text,p_confirmed boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare sender uuid:=auth.uid();issuer public.demo_credit_accounts;payer public.demo_credit_accounts;prior public.demo_invoice_requests;item public.demo_invoice_requests;
begin
 if sender is null then raise exception 'Sign in required';end if;
 if p_confirmed is distinct from true then raise exception 'Review and confirm the demo invoice first';end if;
 if p_id is null or p_payer_code is null or p_reference is null or length(trim(p_reference))not between 1 and 100 or p_reference~'[[:cntrl:]]' or p_amount_atomic is null or p_amount_atomic not between 1 and 100000 or p_description is null or length(p_description)>2000 then raise exception 'Enter a unique reference, customer code and 0.01 to 1000 DUSD';end if;
 perform public.afripay_open_demo_credit_account();
 select * into issuer from public.demo_credit_accounts where user_id=sender;
 select * into payer from public.demo_credit_accounts where receive_code=p_payer_code;
 if payer.user_id is null then raise exception 'Customer code not found. Ask the other account to open Demo Receive first.';end if;
 if payer.user_id=sender then raise exception 'Choose a different customer account';end if;
 -- Stable account lock order matches the ledger and serializes duplicate references.
 perform 1 from public.demo_credit_accounts where user_id in(sender,payer.user_id) order by user_id for update;
 select * into prior from public.demo_invoice_requests where id=p_id;
 if found then
  if prior.issuer_id<>sender or prior.payer_id<>payer.user_id or prior.reference<>trim(p_reference)or prior.amount_atomic<>p_amount_atomic or prior.description<>p_description then raise exception 'This invoice ID was already used for different details';end if;
  return to_jsonb(prior);
 end if;
 if exists(select 1 from public.demo_invoice_requests where issuer_id=sender and lower(trim(reference))=lower(trim(p_reference)))then raise exception 'Invoice reference already used. Refresh Issued invoices before creating another bill.';end if;
 if(select count(*)from public.demo_invoice_requests where issuer_id=sender and created_at>now()-interval '1 hour')>=30 then raise exception 'Demo invoice limit reached. Try again later.';end if;
 insert into public.demo_invoice_requests(id,issuer_id,payer_id,issuer_code,payer_code,issuer_label,payer_label,reference,amount_atomic,description)
 values(p_id,sender,payer.user_id,issuer.receive_code,payer.receive_code,coalesce(nullif(issuer.display_name,''),'Account '||left(issuer.receive_code::text,8)),coalesce(nullif(payer.display_name,''),'Account '||left(payer.receive_code::text,8)),trim(p_reference),p_amount_atomic,p_description)returning * into item;
 return to_jsonb(item);
end$$;

create or replace function public.afripay_demo_invoice_inbox()returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 return jsonb_build_object('invoices',coalesce((select jsonb_agg(to_jsonb(i)order by i.created_at desc,i.id)from(select * from public.demo_invoice_requests where issuer_id=auth.uid()or payer_id=auth.uid()order by created_at desc,id limit 100)i),'[]'::jsonb));
end$$;

create or replace function public.afripay_pay_demo_invoice(p_invoice_id uuid,p_request_id uuid,p_confirmed boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare payer uuid:=auth.uid();item public.demo_invoice_requests;payment public.demo_credit_transfers;
begin
 if payer is null then raise exception 'Sign in required';end if;
 if p_confirmed is distinct from true or p_request_id is null then raise exception 'Review and approve this DUSD payment first';end if;
 -- Match the existing ledger lock order: saved policy, invoice, then sorted credit accounts.
 perform 1 from public.demo_workspaces where user_id=payer for share;
 select * into item from public.demo_invoice_requests where id=p_invoice_id and payer_id=payer for update;
 if not found then raise exception 'Invoice not found or this account cannot pay it';end if;
 if item.state='PAID' then return to_jsonb(item);end if;
 if item.state<>'OPEN' then raise exception 'This invoice is cancelled and cannot be paid';end if;
 -- Amount and recipient come only from the immutable invoice, never from the client.
 payment=public.afripay_record_credit(item.issuer_id,item.amount_atomic,p_request_id,'friend',null,'demo-inbox:'||item.id::text,item.reference);
 update public.demo_invoice_requests set state='PAID',transfer_id=payment.id,paid_at=payment.created_at where id=item.id returning * into item;
 return to_jsonb(item);
end$$;

create or replace function public.afripay_cancel_demo_invoice(p_invoice_id uuid)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare item public.demo_invoice_requests;begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 select * into item from public.demo_invoice_requests where id=p_invoice_id and issuer_id=auth.uid()for update;
 if not found then raise exception 'Invoice not found or this account cannot cancel it';end if;
 if item.state='PAID' then raise exception 'A paid demo invoice cannot be cancelled';end if;
 update public.demo_invoice_requests set state='CANCELLED' where id=item.id returning * into item;
 return to_jsonb(item);
end$$;
revoke all on function public.afripay_create_demo_invoice(uuid,uuid,text,bigint,text,boolean),public.afripay_demo_invoice_inbox(),public.afripay_pay_demo_invoice(uuid,uuid,boolean),public.afripay_cancel_demo_invoice(uuid)from public,anon;
grant execute on function public.afripay_create_demo_invoice(uuid,uuid,text,bigint,text,boolean),public.afripay_demo_invoice_inbox(),public.afripay_pay_demo_invoice(uuid,uuid,boolean),public.afripay_cancel_demo_invoice(uuid)to authenticated;
commit;
