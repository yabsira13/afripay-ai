-- AFRIPAY account-to-account TEST CREDITS and private feedback. No real money.
-- Requires supplier-marketplace.sql for the existing administrator predicate.
begin;
create table if not exists public.demo_credit_accounts(
 user_id uuid primary key references auth.users(id) on delete cascade,
 receive_code uuid not null unique default gen_random_uuid(),
 balance_atomic bigint not null default 0 check(balance_atomic between 0 and 9000000000000),
 faucet_claimed boolean not null default false,created_at timestamptz not null default now()
);
create table if not exists public.demo_credit_transfers(
 id uuid primary key default gen_random_uuid(),request_id uuid not null,
 sender_id uuid not null references public.demo_credit_accounts(user_id),
 recipient_id uuid not null references public.demo_credit_accounts(user_id),
 amount_atomic bigint not null check(amount_atomic between 1 and 100000),
 created_at timestamptz not null default now(),unique(sender_id,request_id),check(sender_id<>recipient_id)
);
create index if not exists demo_transfer_sender_time on public.demo_credit_transfers(sender_id,created_at);
create table if not exists public.demo_credit_entries(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.demo_credit_accounts(user_id),
 transfer_id uuid references public.demo_credit_transfers(id),kind text not null check(kind in('test_grant','sent','received')),
 amount_atomic bigint not null check(amount_atomic<>0),created_at timestamptz not null default now(),
 unique(user_id,transfer_id),check((kind='test_grant' and transfer_id is null and amount_atomic=100000) or(kind='sent' and transfer_id is not null and amount_atomic<0)or(kind='received' and transfer_id is not null and amount_atomic>0))
);
create unique index if not exists one_demo_grant on public.demo_credit_entries(user_id) where kind='test_grant';
alter table public.demo_credit_accounts enable row level security;
alter table public.demo_credit_transfers enable row level security;
alter table public.demo_credit_entries enable row level security;
revoke all on public.demo_credit_accounts,public.demo_credit_transfers,public.demo_credit_entries from anon,authenticated;
grant select on public.demo_credit_accounts,public.demo_credit_transfers,public.demo_credit_entries to authenticated;
drop policy if exists own_demo_credit_account on public.demo_credit_accounts;
create policy own_demo_credit_account on public.demo_credit_accounts for select to authenticated using(user_id=auth.uid());
drop policy if exists own_demo_transfers on public.demo_credit_transfers;
create policy own_demo_transfers on public.demo_credit_transfers for select to authenticated using(sender_id=auth.uid() or recipient_id=auth.uid());
drop policy if exists own_demo_entries on public.demo_credit_entries;
create policy own_demo_entries on public.demo_credit_entries for select to authenticated using(user_id=auth.uid());
create or replace function public.afripay_open_demo_credit_account() returns setof public.demo_credit_accounts language plpgsql security definer set search_path=public,pg_temp as $$begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 insert into public.demo_credit_accounts(user_id)values(auth.uid()) on conflict(user_id)do nothing;
 return query select * from public.demo_credit_accounts where user_id=auth.uid();
end$$;
create or replace function public.afripay_claim_demo_credits() returns setof public.demo_credit_accounts language plpgsql security definer set search_path=public,pg_temp as $$begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 perform public.afripay_open_demo_credit_account();
 perform 1 from public.demo_credit_accounts where user_id=auth.uid() for update;
 if exists(select 1 from public.demo_credit_accounts where user_id=auth.uid() and faucet_claimed)then raise exception 'Test credits have already been claimed';end if;
 update public.demo_credit_accounts set balance_atomic=balance_atomic+100000,faucet_claimed=true where user_id=auth.uid();
 insert into public.demo_credit_entries(user_id,kind,amount_atomic)values(auth.uid(),'test_grant',100000);
 return query select * from public.demo_credit_accounts where user_id=auth.uid();
end$$;
create or replace function public.afripay_transfer_demo_credits(p_recipient_code uuid,p_amount_atomic bigint,p_request_id uuid)
returns setof public.demo_credit_transfers language plpgsql security definer set search_path=public,pg_temp as $$
declare sender uuid:=auth.uid();recipient uuid;previous public.demo_credit_transfers;spent bigint;
begin
 if sender is null then raise exception 'Sign in required';end if;
 if p_request_id is null or p_recipient_code is null or p_amount_atomic is null or p_amount_atomic not between 1 and 100000 then raise exception 'Enter between 0.01 and 1000 DUSD test credits';end if;
 select user_id into recipient from public.demo_credit_accounts where receive_code=p_recipient_code;
 if recipient is null then raise exception 'Recipient code not found. The recipient must open their Demo transfers page first.';end if;
 if recipient=sender then raise exception 'Choose a different recipient account';end if;
 if not exists(select 1 from public.demo_credit_accounts where user_id=sender)then raise exception 'Open your demo credit account first';end if;
 -- Identical lock order prevents opposite-direction transfers deadlocking.
 perform 1 from public.demo_credit_accounts where user_id in(sender,recipient) order by user_id for update;
 select * into previous from public.demo_credit_transfers where sender_id=sender and request_id=p_request_id;
 if found then
  if previous.recipient_id<>recipient or previous.amount_atomic<>p_amount_atomic then raise exception 'This approval ID was already used for different details';end if;
  return next previous;return;
 end if;
 select coalesce(sum(amount_atomic),0)into spent from public.demo_credit_transfers where sender_id=sender and created_at>=(date_trunc('day',now() at time zone 'UTC')at time zone 'UTC');
 if spent+p_amount_atomic>500000 then raise exception 'Daily demo credit limit exceeded (5000 DUSD)';end if;
 if(select balance_atomic from public.demo_credit_accounts where user_id=sender)<p_amount_atomic then raise exception 'Insufficient demo credits';end if;
 update public.demo_credit_accounts set balance_atomic=balance_atomic-p_amount_atomic where user_id=sender;
 update public.demo_credit_accounts set balance_atomic=balance_atomic+p_amount_atomic where user_id=recipient;
 insert into public.demo_credit_transfers(request_id,sender_id,recipient_id,amount_atomic)values(p_request_id,sender,recipient,p_amount_atomic)returning * into previous;
 insert into public.demo_credit_entries(user_id,transfer_id,kind,amount_atomic)values(sender,previous.id,'sent',-p_amount_atomic),(recipient,previous.id,'received',p_amount_atomic);
 return next previous;
end$$;
revoke all on function public.afripay_open_demo_credit_account(),public.afripay_claim_demo_credits(),public.afripay_transfer_demo_credits(uuid,bigint,uuid) from public,anon;
grant execute on function public.afripay_open_demo_credit_account(),public.afripay_claim_demo_credits(),public.afripay_transfer_demo_credits(uuid,bigint,uuid) to authenticated;
create table if not exists public.product_feedback(
 id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id)on delete cascade,
 category text not null check(category in('idea','bug','comment')),message text not null check(length(trim(message))between 10 and 2000),created_at timestamptz not null default now()
);
alter table public.product_feedback enable row level security;
revoke all on public.product_feedback from anon,authenticated;
grant select on public.product_feedback to authenticated;
grant insert(user_id,category,message) on public.product_feedback to authenticated;
drop policy if exists feedback_owner_insert on public.product_feedback;
create policy feedback_owner_insert on public.product_feedback for insert to authenticated with check(user_id=auth.uid() and (select count(*)from public.product_feedback where user_id=auth.uid() and created_at>now()-interval '1 hour')<5);
drop policy if exists feedback_owner_admin_read on public.product_feedback;
create policy feedback_owner_admin_read on public.product_feedback for select to authenticated using(user_id=auth.uid() or public.afripay_is_admin());
commit;
