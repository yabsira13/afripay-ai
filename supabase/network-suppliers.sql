-- 0.9.5: separate mainnet and testnet supplier registrations. Run after supplier-marketplace.sql.
-- Existing demo applications are preserved. No keys or spending permissions are stored.
begin;
create extension if not exists pgcrypto;
create table if not exists public.afripay_admins(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
alter table public.afripay_admins enable row level security;
revoke all on public.afripay_admins from anon,authenticated;
grant select on public.afripay_admins to authenticated;
drop policy if exists own_admin_membership on public.afripay_admins;
create policy own_admin_membership on public.afripay_admins for select to authenticated using(user_id=auth.uid());
create or replace function public.afripay_is_admin() returns boolean language sql stable security definer set search_path=public as $$select auth.uid() is not null and exists(select 1 from public.afripay_admins where user_id=auth.uid())$$;
revoke all on function public.afripay_is_admin() from public,anon;
grant execute on function public.afripay_is_admin() to authenticated;
create table if not exists public.network_supplier_applications(
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,
 network text not null check(network in('mainnet','testnet')),unique(owner_id,network),
 business_name text not null check(length(trim(business_name)) between 2 and 160),country text not null check(length(trim(country)) between 2 and 80),
 wallet text not null,chain text not null check(chain in('near','base','eth','arb','sol','bsc')),
 status text not null default 'pending' check(status in('pending','approved','rejected')),
 wallet_verified_at timestamptz,reviewed_by uuid references auth.users(id),reviewed_at timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(network='mainnet' or chain='near'),
 check(case when network='testnet' then wallet ~ '^[a-z0-9]+([._-][a-z0-9]+)*[.]testnet$' and length(wallet) between 9 and 64 when chain='near' then length(wallet) between 2 and 64 and wallet ~ '^[a-z0-9]+([._-][a-z0-9]+)*$' and wallet not like '%.testnet' when chain in('base','eth','arb','bsc') then wallet ~ '^0x[0-9a-fA-F]{40}$' else wallet ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$' end),
 check(status<>'approved' or (wallet_verified_at is not null and reviewed_by is not null and reviewed_at is not null))
);
-- Legacy registrations already contain mainnet destinations. Preserve their review status;
-- never turn invoice contacts or demo sample suppliers into approved applications.
-- DDL and copying are atomic; restore the write guard below before committing.
drop trigger if exists supplier_write_guard on public.network_supplier_applications;
insert into public.network_supplier_applications(id,owner_id,network,business_name,country,wallet,chain,status,wallet_verified_at,reviewed_by,reviewed_at,created_at,updated_at)
 select id,owner_id,'mainnet',business_name,country,wallet,chain,status,wallet_verified_at,reviewed_by,reviewed_at,created_at,updated_at from public.supplier_applications
 on conflict(owner_id,network) do nothing;
create table if not exists public.network_supplier_review_logs(id uuid primary key default gen_random_uuid(),application_id uuid not null references public.network_supplier_applications(id),reviewer_id uuid not null references auth.users(id),decision text not null check(decision in('approved','rejected')),wallet text not null,chain text not null,note text check(length(note)<=1000),created_at timestamptz not null default now());
create index if not exists network_supplier_status_created on public.network_supplier_applications(status,created_at);
alter table public.network_supplier_applications enable row level security;
alter table public.network_supplier_review_logs enable row level security;
revoke all on public.network_supplier_applications,public.network_supplier_review_logs from anon,authenticated;
grant select,insert,update on public.network_supplier_applications to authenticated;
grant select on public.network_supplier_review_logs to authenticated;
drop policy if exists supplier_visible on public.network_supplier_applications;
create policy supplier_visible on public.network_supplier_applications for select to authenticated using(status='approved' or owner_id=auth.uid() or public.afripay_is_admin());
drop policy if exists supplier_apply on public.network_supplier_applications;
create policy supplier_apply on public.network_supplier_applications for insert to authenticated with check(owner_id=auth.uid());
drop policy if exists supplier_resubmit on public.network_supplier_applications;
create policy supplier_resubmit on public.network_supplier_applications for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists admin_review_history on public.network_supplier_review_logs;
create policy admin_review_history on public.network_supplier_review_logs for select to authenticated using(public.afripay_is_admin());
create or replace function public.afripay_guard_network_supplier() returns trigger language plpgsql security definer set search_path=public as $$begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if tg_op='UPDATE' and new.network<>old.network then raise exception 'Registration network cannot be changed';end if;
 if tg_op='UPDATE' and new.owner_id<>old.owner_id then raise exception 'Supplier ownership cannot be changed';end if;
 if not public.afripay_is_admin() then
  if new.owner_id<>auth.uid() then raise exception 'Cannot edit another supplier';end if;
  -- Every owner edit, including an approved wallet change, requires a fresh admin review.
  new.status='pending';new.wallet_verified_at=null;new.reviewed_by=null;new.reviewed_at=null;
 end if;
 if tg_op='INSERT' then new.created_at=now();else new.created_at=old.created_at;end if;
 new.updated_at=now();return new;
end$$;
revoke all on function public.afripay_guard_network_supplier() from public,anon,authenticated;
drop trigger if exists supplier_write_guard on public.network_supplier_applications;
create trigger supplier_write_guard before insert or update on public.network_supplier_applications for each row execute function public.afripay_guard_network_supplier();
create or replace function public.afripay_review_network_supplier(application_id uuid,decision text,expected_wallet text,expected_chain text,expected_updated_at timestamptz,verified_wallet boolean default false,review_note text default null) returns void language plpgsql security definer set search_path=public as $$declare selected public.network_supplier_applications;begin
 if not public.afripay_is_admin() then raise exception 'Administrator access required';end if;
 if decision not in('approved','rejected') then raise exception 'Invalid review decision';end if;
 if decision='approved' and not coalesce(verified_wallet,false) then raise exception 'Independently verify the supplier wallet before approval';end if;
 if length(review_note)>1000 then raise exception 'Review note is too long';end if;
 select * into selected from public.network_supplier_applications where id=application_id for update;
 if not found then raise exception 'Application not found';end if;
 if selected.wallet is distinct from expected_wallet or selected.chain is distinct from expected_chain or selected.updated_at is distinct from expected_updated_at then raise exception 'Application changed since you reviewed it. Reload and verify the latest details.';end if;
 update public.network_supplier_applications set status=decision,reviewed_by=auth.uid(),reviewed_at=now(),wallet_verified_at=case when decision='approved' then now() else null end where id=application_id;
 insert into public.network_supplier_review_logs(application_id,reviewer_id,decision,wallet,chain,note) values(application_id,auth.uid(),decision,selected.wallet,selected.chain,review_note);
end$$;
revoke all on function public.afripay_review_network_supplier(uuid,text,text,text,timestamptz,boolean,text) from public,anon;
grant execute on function public.afripay_review_network_supplier(uuid,text,text,text,timestamptz,boolean,text) to authenticated;
commit;
-- To appoint the founder, use SQL Editor AFTER finding their actual UUID in Authentication > Users:
-- insert into public.afripay_admins(user_id) values ('YOUR-ACTUAL-AUTH-USER-UUID') on conflict do nothing;
-- Never add an admin-membership write policy or a public "become admin" endpoint.
