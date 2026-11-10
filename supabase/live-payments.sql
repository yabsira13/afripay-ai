-- AFRIPAY 0.7: real MAINNET payment records, separate from DUSD/demo documents.
-- Requires Supabase Auth. No client write access. Service key stays on the server.
begin;
create table if not exists public.live_spending_policies(
 user_id uuid primary key references auth.users(id),
 single_near numeric(30,24) not null default 0.1 check(single_near>0 and single_near<=0.5),
 daily_near numeric(30,24) not null default 0.3 check(daily_near>=single_near and daily_near<=2)
);
create table if not exists public.live_payment_orders(
 id uuid primary key,user_id uuid not null references auth.users(id),
 input jsonb not null,sender text not null,recipient text not null,destination_asset text not null,destination_chain text not null,
 invoice_reference text not null,amount_out text not null check(amount_out ~ '^[1-9][0-9]{0,77}$'),
 max_input text not null check(max_input ~ '^[1-9][0-9]{0,77}$'),
 state text not null default 'QUOTED' check(state in('QUOTED','COMMITTING','COMMITTED','AUTHORIZING','SUBMITTED','PENDING_DEPOSIT','KNOWN_DEPOSIT_TX','PROCESSING','INCOMPLETE_DEPOSIT','FAILED','REFUNDED','SUCCESS','EXPIRED','NEEDS_RECONCILIATION')),
 dry_quote jsonb not null,committed_quote jsonb,risk jsonb not null,
 expires_at timestamptz not null,deposit_address text,funding_hash text,
 settled_at timestamptz,evidence jsonb,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index if not exists live_invoice_once on public.live_payment_orders(user_id,lower(trim(invoice_reference))) where state not in('EXPIRED','REFUNDED');
create unique index if not exists live_deposit_once on public.live_payment_orders(deposit_address) where deposit_address is not null;
create unique index if not exists live_funding_once on public.live_payment_orders(funding_hash) where funding_hash is not null;
create table if not exists public.live_payment_events(
 id bigint generated always as identity primary key,order_id uuid not null references public.live_payment_orders(id),user_id uuid not null references auth.users(id),event text not null,detail jsonb not null default '{}',created_at timestamptz not null default now()
);
alter table public.live_spending_policies enable row level security;
alter table public.live_payment_orders enable row level security;
alter table public.live_payment_events enable row level security;
revoke all on public.live_spending_policies,public.live_payment_orders,public.live_payment_events from anon,authenticated;
grant select on public.live_spending_policies,public.live_payment_orders,public.live_payment_events to authenticated;
grant all on public.live_spending_policies,public.live_payment_orders,public.live_payment_events to service_role;
grant usage,select on sequence public.live_payment_events_id_seq to service_role;
drop policy if exists live_policy_owner on public.live_spending_policies;
create policy live_policy_owner on public.live_spending_policies for select to authenticated using(user_id=auth.uid());
drop policy if exists live_order_owner on public.live_payment_orders;
create policy live_order_owner on public.live_payment_orders for select to authenticated using(user_id=auth.uid());
drop policy if exists live_event_owner on public.live_payment_events;
create policy live_event_owner on public.live_payment_events for select to authenticated using(user_id=auth.uid());
create or replace function public.afripay_set_live_limits(p_single numeric,p_daily numeric) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 if p_single is null or p_daily is null or p_single<=0 or p_single>0.5 or p_daily<p_single or p_daily>2 then raise exception 'Limits: up to 0.5 NEAR per payment and 2 NEAR per day';end if;
 insert into public.live_spending_policies(user_id,single_near,daily_near)values(auth.uid(),p_single,p_daily)on conflict(user_id)do update set single_near=excluded.single_near,daily_near=excluded.daily_near;
end$$;
revoke all on function public.afripay_set_live_limits(numeric,numeric) from public,anon;
grant execute on function public.afripay_set_live_limits(numeric,numeric) to authenticated;
create or replace function public.afripay_live_reserve(p_user uuid,p_id uuid,p_input jsonb,p_quote jsonb,p_risk jsonb,p_expires timestamptz)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare old public.live_payment_orders;pol public.live_spending_policies;cost numeric;total numeric;
begin
 insert into public.live_spending_policies(user_id)values(p_user)on conflict do nothing;
 select * into pol from public.live_spending_policies where user_id=p_user for update;
 select * into old from public.live_payment_orders where id=p_id;
 if found then if old.user_id<>p_user or old.input<>p_input then raise exception 'Approval ID already used for different details';end if;return to_jsonb(old);end if;
 if p_id is null or p_input is null or p_quote is null or p_risk is null or p_expires<=now() or (p_risk->>'blocked')::boolean or (p_risk->>'score')::int >=80 then raise exception 'Invalid or blocked live payment';end if;
 if exists(select 1 from public.live_payment_orders where user_id=p_user and sender=p_input->>'sender' and recipient=p_input->>'recipient' and destination_asset=p_input->>'destinationAsset' and amount_out=p_quote->'quoteRequest'->>'amount' and created_at>now()-interval '10 minutes' and state not in('EXPIRED','REFUNDED'))then raise exception 'Matching recent live payment exists. Check its history before retrying';end if;
 cost:=(p_quote->'quote'->>'amountIn')::numeric;
 if cost<=0 or cost>pol.single_near*1e24 then raise exception 'Live per-payment NEAR limit exceeded';end if;
 update public.live_payment_orders set state='EXPIRED',updated_at=now() where user_id=p_user and state='QUOTED' and expires_at<=now();
 select coalesce(sum(max_input::numeric),0)into total from public.live_payment_orders where user_id=p_user and (created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC' or state in('COMMITTING','COMMITTED','AUTHORIZING','SUBMITTED','PENDING_DEPOSIT','KNOWN_DEPOSIT_TX','PROCESSING','INCOMPLETE_DEPOSIT','NEEDS_RECONCILIATION','FAILED')) and state not in('EXPIRED','REFUNDED');
 if cost+total>pol.daily_near*1e24 then raise exception 'Live daily NEAR limit exceeded';end if;
 -- Only uncommitted, never-authorized quotes can expire automatically.
 insert into public.live_payment_orders(id,user_id,input,sender,recipient,destination_asset,destination_chain,invoice_reference,amount_out,max_input,dry_quote,risk,expires_at)
 values(p_id,p_user,p_input,p_input->>'sender',p_input->>'recipient',p_input->>'destinationAsset',p_input->>'destinationChain',p_input->>'invoiceReference',p_quote->'quoteRequest'->>'amount',cost::text,p_quote,p_risk,p_expires) returning * into old;
 insert into public.live_payment_events(order_id,user_id,event,detail)values(p_id,p_user,'Dry quote reviewed',p_risk);
 return to_jsonb(old);
end$$;
create or replace function public.afripay_live_claim(p_user uuid,p_id uuid,p_step text)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.live_payment_orders;pol public.live_spending_policies;total numeric;
begin
 select * into pol from public.live_spending_policies where user_id=p_user for update;
 select * into r from public.live_payment_orders where id=p_id and user_id=p_user for update;
 if not found then raise exception 'Payment not found';end if;
 if p_step not in('commit','authorize')then raise exception 'Invalid payment step';end if;
 if p_step='commit' and r.state<>'QUOTED' then return jsonb_build_object('fresh',false,'order',to_jsonb(r));end if;
 if p_step='authorize' and r.state<>'COMMITTED' then return jsonb_build_object('fresh',false,'order',to_jsonb(r));end if;
 if r.expires_at<=now()+interval '30 seconds' then raise exception 'Quote expired. Do not fund';end if;
 select coalesce(sum(max_input::numeric),0)into total from public.live_payment_orders where user_id=p_user and id<>p_id and (created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC' or state in('COMMITTING','COMMITTED','AUTHORIZING','SUBMITTED','PENDING_DEPOSIT','KNOWN_DEPOSIT_TX','PROCESSING','INCOMPLETE_DEPOSIT','NEEDS_RECONCILIATION','FAILED')) and state not in('EXPIRED','REFUNDED');
 if total+r.max_input::numeric>pol.daily_near*1e24 then raise exception 'Live daily spending policy changed';end if;
 if r.max_input::numeric>pol.single_near*1e24 then raise exception 'Live spending policy changed';end if;
 update public.live_payment_orders set state=case when p_step='commit'then 'COMMITTING'else 'AUTHORIZING'end,updated_at=now()where id=p_id returning * into r;
 insert into public.live_payment_events(order_id,user_id,event)values(p_id,p_user,case when p_step='commit'then 'Human approved dry quote; commit claimed'else 'Wallet authorization claimed once'end);
 return jsonb_build_object('fresh',true,'order',to_jsonb(r));
end$$;
create or replace function public.afripay_live_commit(p_user uuid,p_id uuid,p_quote jsonb,p_expires timestamptz)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.live_payment_orders;
begin
 select * into r from public.live_payment_orders where id=p_id and user_id=p_user for update;
 if not found or r.state<>'COMMITTING'then raise exception 'Commit is not reserved';end if;
 if (p_quote->'quote'->>'amountIn')::numeric>r.max_input::numeric or (p_quote->'quote'->>'minAmountOut')::numeric<(r.dry_quote->'quote'->>'minAmountOut')::numeric or p_expires<=now()+interval '30 seconds' then raise exception 'Committed quote worsened or expired. Nothing sent';end if;
 update public.live_payment_orders set state='COMMITTED',committed_quote=p_quote,deposit_address=p_quote->'quote'->>'depositAddress',expires_at=p_expires,updated_at=now()where id=p_id returning * into r;
 insert into public.live_payment_events(order_id,user_id,event)values(p_id,p_user,'Signed committed quote stored');return to_jsonb(r);
end$$;
create or replace function public.afripay_live_attach(p_user uuid,p_id uuid,p_hash text)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.live_payment_orders;
begin
 select * into r from public.live_payment_orders where id=p_id and user_id=p_user for update;
 if not found or r.committed_quote is null or r.state not in('AUTHORIZING','SUBMITTED','PENDING_DEPOSIT','KNOWN_DEPOSIT_TX','PROCESSING','INCOMPLETE_DEPOSIT','NEEDS_RECONCILIATION','SUCCESS','FAILED','REFUNDED')then raise exception 'No wallet authorization is reserved';end if;
 if p_hash is null or p_hash!~'^[1-9A-HJ-NP-Za-km-z]{32,64}$'or(r.funding_hash is not null and r.funding_hash<>p_hash)then raise exception 'Funding hash changed or invalid';end if;
 if r.funding_hash is null then update public.live_payment_orders set funding_hash=p_hash,state='SUBMITTED',updated_at=now()where id=p_id returning * into r;insert into public.live_payment_events(order_id,user_id,event,detail)values(p_id,p_user,'Funding hash attached',jsonb_build_object('hash',p_hash));end if;
 return to_jsonb(r);
end$$;
create or replace function public.afripay_live_observe(p_user uuid,p_id uuid,p_state text,p_evidence jsonb)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.live_payment_orders;
begin
 select * into r from public.live_payment_orders where id=p_id and user_id=p_user for update;
 if not found then raise exception 'Payment not found';end if;
 if r.state=p_state then return to_jsonb(r);end if;
 if r.state in('SUCCESS','REFUNDED')then return to_jsonb(r);end if;
 if p_state not in('EXPIRED','PENDING_DEPOSIT','KNOWN_DEPOSIT_TX','PROCESSING','INCOMPLETE_DEPOSIT','FAILED','REFUNDED','SUCCESS','NEEDS_RECONCILIATION')then raise exception 'Invalid state';end if;
 if p_state='EXPIRED'and(r.state<>'QUOTED' or r.committed_quote is not null)then raise exception 'Only an uncommitted dry quote can be discarded';end if;
 if p_state='SUCCESS'and(r.funding_hash is null or p_evidence->>'verified' is distinct from 'true')then raise exception 'Settlement evidence required';end if;
 update public.live_payment_orders set state=p_state,evidence=p_evidence,settled_at=case when p_state='SUCCESS'then now()else null end,updated_at=now()where id=p_id returning * into r;
 insert into public.live_payment_events(order_id,user_id,event,detail)values(p_id,p_user,p_state,p_evidence);return to_jsonb(r);
end$$;
revoke all on function public.afripay_live_reserve(uuid,uuid,jsonb,jsonb,jsonb,timestamptz),public.afripay_live_claim(uuid,uuid,text),public.afripay_live_commit(uuid,uuid,jsonb,timestamptz),public.afripay_live_attach(uuid,uuid,text),public.afripay_live_observe(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.afripay_live_reserve(uuid,uuid,jsonb,jsonb,jsonb,timestamptz),public.afripay_live_claim(uuid,uuid,text),public.afripay_live_commit(uuid,uuid,jsonb,timestamptz),public.afripay_live_attach(uuid,uuid,text),public.afripay_live_observe(uuid,uuid,text,jsonb) to service_role;
commit;
