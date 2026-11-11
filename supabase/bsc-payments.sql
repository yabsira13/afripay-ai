-- 0.9.4 BSC direct USDT/USDC. Run after live-payment-links.sql.
begin;
alter table public.live_payment_requests add column if not exists bound_route text not null default 'NEAR' check(bound_route in('NEAR','BSC'));
create table if not exists public.bsc_spending_locks(user_id uuid primary key references auth.users(id));
create table if not exists public.bsc_transfer_orders(
 id uuid primary key,user_id uuid not null references auth.users(id),input jsonb not null,review jsonb not null,
 sender text not null,recipient text not null,asset text not null,amount_atomic text not null check(amount_atomic ~ '^[1-9][0-9]*$' and amount_atomic::numeric<=10000000000000000000),
 invoice_reference text not null,state text not null default 'REVIEWED' check(state in('REVIEWED','AUTHORIZING','SUBMITTED','SUCCESS','FAILED','EXPIRED')),
 funding_hash text unique,evidence jsonb,created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '5 minutes',settled_at timestamptz
);
create unique index if not exists bsc_invoice_once on public.bsc_transfer_orders(user_id,lower(trim(invoice_reference))) where state<>'EXPIRED';
alter table public.bsc_spending_locks enable row level security;alter table public.bsc_transfer_orders enable row level security;
revoke all on public.bsc_spending_locks,public.bsc_transfer_orders from anon,authenticated;
grant all on public.bsc_spending_locks,public.bsc_transfer_orders to service_role;
grant select on public.bsc_transfer_orders to authenticated;
drop policy if exists bsc_order_owner on public.bsc_transfer_orders;
create policy bsc_order_owner on public.bsc_transfer_orders for select to authenticated using(user_id=auth.uid());
create or replace function public.afripay_bsc_reserve(p_user uuid,p_id uuid,p_input jsonb,p_review jsonb)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.bsc_transfer_orders;req public.live_payment_requests;old_state text;total numeric;atomic numeric;
begin
 insert into public.live_spending_policies(user_id)values(p_user)on conflict do nothing;perform 1 from public.live_spending_policies where user_id=p_user for update;
 insert into public.bsc_spending_locks values(p_user)on conflict do nothing;perform 1 from public.bsc_spending_locks where user_id=p_user for update;
 select * into r from public.bsc_transfer_orders where id=p_id;
 if found then if r.user_id<>p_user or r.input<>p_input then raise exception 'Review ID changed';end if;return to_jsonb(r);end if;
 if exists(select 1 from public.live_payment_orders where user_id=p_user and lower(trim(invoice_reference))=lower(trim(p_input->>'invoiceReference'))and state not in('EXPIRED','REFUNDED'))then raise exception 'This reference already has a NEAR payment; check it before paying on BSC';end if;
 if p_input->>'destinationAsset' not in('nep141:bnb-0x55d398326f99059ff775485246999027b3197955.omdep.near','nep141:bnb-0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d.omdep.near')or p_input->>'recipientVerified' is distinct from 'true' then raise exception 'Unsupported BSC token or missing review';end if;
 if p_review->'risk'->>'blocked'='true'then raise exception 'Blocked BSC payment';end if;
 atomic:=(p_review->>'atomic')::numeric;if atomic is null or atomic<>(p_input->>'amount')::numeric*1e18 or atomic<=0 or atomic>10000000000000000000 then raise exception 'BSC per-transfer limit is 10 tokens';end if;
 if p_input ? 'requestToken' then
  select * into req from public.live_payment_requests where token=p_input->>'requestToken' for update;
  if not found or req.state<>'OPEN' or req.expires_at<=now() or req.data->>'destinationChain'<>'bsc' then raise exception 'Invoice unavailable for BSC payment';end if;
  if exists(select 1 from unnest(array['recipient','destinationAsset','amount','invoiceReference','invoiceText'])k where req.data->>k is distinct from p_input->>k)then raise exception 'Details differ from published invoice';end if;
  if req.bound_order is not null then
   if req.bound_route='BSC' then select state into old_state from public.bsc_transfer_orders where id=req.bound_order;else select state into old_state from public.live_payment_orders where id=req.bound_order;end if;
   if old_state is null or old_state not in('EXPIRED','REFUNDED')then raise exception 'Invoice already has a payment in progress';end if;
  end if;
 end if;
 update public.bsc_transfer_orders set state='EXPIRED' where user_id=p_user and state='REVIEWED' and expires_at<=now();
 if exists(select 1 from public.bsc_transfer_orders where user_id=p_user and sender=lower(p_input->>'sender') and recipient=lower(p_input->>'recipient') and asset=p_input->>'destinationAsset' and amount_atomic::numeric=atomic and created_at>now()-interval '10 minutes' and state<>'EXPIRED')then raise exception 'Matching BSC transfer exists; check history before retrying';end if;
 select coalesce(sum(amount_atomic::numeric),0) into total from public.bsc_transfer_orders where user_id=p_user and asset=p_input->>'destinationAsset' and state<>'EXPIRED' and(created_at>=date_trunc('day',now() at time zone 'UTC')at time zone 'UTC' or state in('AUTHORIZING','SUBMITTED','FAILED'));
 if total+atomic>30000000000000000000 then raise exception 'BSC daily limit is 30 tokens per asset';end if;
 insert into public.bsc_transfer_orders(id,user_id,input,review,sender,recipient,asset,amount_atomic,invoice_reference)values(p_id,p_user,p_input,p_review,lower(p_input->>'sender'),lower(p_input->>'recipient'),p_input->>'destinationAsset',atomic::text,p_input->>'invoiceReference')returning * into r;
 if req.id is not null then update public.live_payment_requests set bound_order=p_id,bound_route='BSC' where id=req.id;end if;return to_jsonb(r);
end$$;
create or replace function public.afripay_bsc_claim(p_user uuid,p_id uuid)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.bsc_transfer_orders;req public.live_payment_requests;
begin
 perform 1 from public.live_spending_policies where user_id=p_user for update;perform 1 from public.bsc_spending_locks where user_id=p_user for update;select * into r from public.bsc_transfer_orders where id=p_id and user_id=p_user;
 if r.input ? 'requestToken' then select * into req from public.live_payment_requests where token=r.input->>'requestToken' for update;if not found or req.bound_route<>'BSC' or req.bound_order<>p_id or req.state<>'OPEN' or req.expires_at<=now()then raise exception 'Invoice expired, cancelled or changed';end if;end if;
 select * into r from public.bsc_transfer_orders where id=p_id and user_id=p_user for update;
 if not found or r.state<>'REVIEWED' or r.expires_at<=now()+interval '30 seconds' then raise exception 'Authorization already claimed or expired; check wallet activity, do not resend';end if;
 update public.bsc_transfer_orders set state='AUTHORIZING' where id=p_id returning * into r;return to_jsonb(r);
end$$;
create or replace function public.afripay_bsc_attach(p_user uuid,p_id uuid,p_hash text)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.bsc_transfer_orders;
begin
 select * into r from public.bsc_transfer_orders where id=p_id and user_id=p_user for update;
 if not found or r.state not in('AUTHORIZING','SUBMITTED','SUCCESS','FAILED') or p_hash!~'^0x[a-f0-9]{64}$' or(r.funding_hash is not null and r.funding_hash<>p_hash)then raise exception 'Invalid or changed BSC transaction hash';end if;
 if r.funding_hash is null then update public.bsc_transfer_orders set funding_hash=p_hash,state='SUBMITTED' where id=p_id returning * into r;end if;return to_jsonb(r);
end$$;
create or replace function public.afripay_bsc_observe(p_user uuid,p_id uuid,p_state text,p_evidence jsonb)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.bsc_transfer_orders;
begin
 select * into r from public.bsc_transfer_orders where id=p_id and user_id=p_user for update;
 if not found or r.funding_hash is null then raise exception 'Submitted transfer required';end if;if r.state in('SUCCESS','FAILED')then return to_jsonb(r);end if;
 if r.state<>'SUBMITTED' or p_state not in('SUCCESS','FAILED') or(p_state='SUCCESS' and(p_evidence->>'verified' is distinct from 'true' or p_evidence->>'hash'<>r.funding_hash or (p_evidence->>'amountOut')::numeric<>r.amount_atomic::numeric or(p_evidence->>'confirmations')::int<12))then raise exception 'Matching BSC execution evidence required';end if;
 update public.bsc_transfer_orders set state=p_state,evidence=p_evidence,settled_at=case when p_state='SUCCESS'then now()else null end where id=p_id returning * into r;return to_jsonb(r);
end$$;
revoke all on function public.afripay_bsc_reserve(uuid,uuid,jsonb,jsonb),public.afripay_bsc_claim(uuid,uuid),public.afripay_bsc_attach(uuid,uuid,text),public.afripay_bsc_observe(uuid,uuid,text,jsonb)from public,anon,authenticated;
grant execute on function public.afripay_bsc_reserve(uuid,uuid,jsonb,jsonb),public.afripay_bsc_claim(uuid,uuid),public.afripay_bsc_attach(uuid,uuid,text),public.afripay_bsc_observe(uuid,uuid,text,jsonb)to service_role;
commit;
