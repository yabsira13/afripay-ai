-- AFRIPAY private account profiles. Run once in Supabase SQL Editor.
-- This adds profiles; it does not replace supplier approvals or administrator memberships.
begin;
create table if not exists public.account_profiles(
 user_id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '' check(length(full_name)<=100),
 account_type text not null default 'customer' check(account_type in('customer','supplier')),
 business_name text not null default '' check(length(business_name)<=160),
 country text not null default '' check(length(country)<=80),
 reporting_currency text not null default 'USD' check(reporting_currency='USD'),
 onboarding_completed boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(not onboarding_completed or (length(trim(full_name))>=2 and length(trim(business_name))>=2 and length(trim(country))>=2))
);
alter table public.account_profiles enable row level security;
revoke all on public.account_profiles from anon,authenticated;
grant select,insert,update on public.account_profiles to authenticated;
drop policy if exists profile_owner_read on public.account_profiles;
create policy profile_owner_read on public.account_profiles for select to authenticated using(user_id=auth.uid());
drop policy if exists profile_owner_insert on public.account_profiles;
create policy profile_owner_insert on public.account_profiles for insert to authenticated with check(user_id=auth.uid());
drop policy if exists profile_owner_update on public.account_profiles;
create policy profile_owner_update on public.account_profiles for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create or replace function public.afripay_profile_timestamps() returns trigger language plpgsql set search_path=public as $$begin
 if tg_op='UPDATE' then
  if new.user_id<>old.user_id then raise exception 'Profile ownership cannot change';end if;
  new.created_at=old.created_at;
 else new.created_at=now();end if;
 new.updated_at=now();return new;
end$$;
revoke all on function public.afripay_profile_timestamps() from public,anon,authenticated;
drop trigger if exists profile_timestamps on public.account_profiles;
create trigger profile_timestamps before insert or update on public.account_profiles for each row execute function public.afripay_profile_timestamps();
-- Metadata pre-fills a person's own profile only. It NEVER grants administrative permissions.
create or replace function public.afripay_seed_private_profile() returns trigger language plpgsql security definer set search_path=public as $$begin
 insert into public.account_profiles(user_id,full_name,account_type)
 values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),100),case when new.raw_user_meta_data->>'account_type'='supplier' then 'supplier' else 'customer' end)
 on conflict(user_id) do nothing;
 return new;
end$$;
revoke all on function public.afripay_seed_private_profile() from public,anon,authenticated;
drop trigger if exists afripay_auth_profile on auth.users;
create trigger afripay_auth_profile after insert on auth.users for each row execute function public.afripay_seed_private_profile();
-- Existing users keep their UID, passwords, suppliers and administrator membership.
insert into public.account_profiles(user_id,full_name,account_type)
 select id,left(coalesce(raw_user_meta_data->>'full_name',''),100),case when raw_user_meta_data->>'account_type'='supplier' then 'supplier' else 'customer' end from auth.users
 on conflict(user_id) do nothing;
commit;
