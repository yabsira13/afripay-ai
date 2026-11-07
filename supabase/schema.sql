-- AFRIPAY AI: production schema foundation. Apply in a NEW Supabase project.
-- The demo UI does not claim to persist business data to these tables.
begin;
create extension if not exists pgcrypto;
create table public.users (id uuid primary key references auth.users(id) on delete cascade, display_name text, created_at timestamptz not null default now());
create table public.businesses (id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 160), created_at timestamptz not null default now());
create table public.business_members (business_id uuid references public.businesses on delete cascade,user_id uuid references auth.users on delete cascade,role text not null check(role in ('owner','reviewer','viewer')),created_at timestamptz not null default now(),primary key(business_id,user_id));
create function public.is_business_member(target uuid) returns boolean language sql stable security definer set search_path = public as $$select exists(select 1 from public.business_members where business_id=target and user_id=auth.uid())$$;
create function public.can_manage_business(target uuid) returns boolean language sql stable security definer set search_path = public as $$select exists(select 1 from public.business_members where business_id=target and user_id=auth.uid() and role='owner')$$;
revoke all on function public.is_business_member(uuid) from public;
revoke all on function public.can_manage_business(uuid) from public;
grant execute on function public.is_business_member(uuid),public.can_manage_business(uuid) to authenticated;
create table public.suppliers (id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses,name text not null,verified_at timestamptz,verified_by uuid references auth.users,created_at timestamptz not null default now(),unique(business_id,name),unique(id,business_id));
create table public.wallet_addresses (id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses,supplier_id uuid,address text not null,chain text not null,verified_at timestamptz,verified_by uuid references auth.users,created_at timestamptz not null default now(),foreign key(supplier_id,business_id) references public.suppliers(id,business_id),unique(business_id,chain,address));
create table public.invoices (id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses,supplier_id uuid not null,invoice_number text not null,amount numeric(38,18) not null check(amount>0),currency text not null,recipient_address text not null,chain text not null,due_date date,status text not null default 'review' check(status in('review','ready','flagged','paid')),recipient_verified_at timestamptz,recipient_verified_by uuid references auth.users,extracted_fields jsonb not null default '{}',document_sha256 text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(business_id,supplier_id,invoice_number),unique(id,business_id),foreign key(supplier_id,business_id) references public.suppliers(id,business_id));
create table public.payment_quotes (id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses,invoice_id uuid,mode text not null check(mode='live'),phase text not null check(phase in('dry','committed')),request jsonb not null,response jsonb not null,deposit_address text,deposit_memo text,expires_at timestamptz not null,approved_by uuid references auth.users,approved_at timestamptz,created_at timestamptz not null default now(),unique(id,business_id),foreign key(invoice_id,business_id) references public.invoices(id,business_id));
create table public.transactions (id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses,invoice_id uuid,quote_id uuid not null,mode text not null default 'live' check(mode='live'),idempotency_key uuid not null unique,amount_atomic text not null check(amount_atomic ~ '^[0-9]+$'),asset_id text not null,recipient_address text not null,chain text not null,status text not null check(status in('approved','pending_deposit','known_deposit_tx','processing','incomplete_deposit','success','failed','refunded')),deposit_tx_hash text,settlement_tx_hash text,settlement_evidence jsonb,settled_at timestamptz,authorized_by uuid not null references auth.users,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),foreign key(invoice_id,business_id) references public.invoices(id,business_id),foreign key(quote_id,business_id) references public.payment_quotes(id,business_id),check(status<>'success' or (settlement_tx_hash is not null and settlement_evidence is not null and settled_at is not null)));
create unique index one_active_invoice_payment on public.transactions(invoice_id) where invoice_id is not null and status not in('failed','refunded');
create table public.security_scans (id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses,kind text not null check(kind in('wallet','transaction','invoice','url')),subject text not null,data_availability jsonb not null,created_by uuid not null references auth.users,created_at timestamptz not null default now(),unique(id,business_id));
create table public.risk_assessments (id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses,scan_id uuid not null,score integer not null check(score between 0 and 100),classification text not null check(classification in('Low','Medium','High','Critical')),evidence jsonb not null,engine_version text not null,created_at timestamptz not null default now(),foreign key(scan_id,business_id) references public.security_scans(id,business_id));
create table public.threat_intelligence_references (id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses,scan_id uuid not null,source_url text not null,provider text not null,category text not null check(category in('confirmed','observation','heuristic','unknown')),observed_at timestamptz not null,payload_sha256 text,created_at timestamptz not null default now(),foreign key(scan_id,business_id) references public.security_scans(id,business_id));
create table public.security_alerts (id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses,title text not null,evidence jsonb not null,reviewed_by uuid references auth.users,reviewed_at timestamptz,created_at timestamptz not null default now());
create table public.audit_logs (id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses,actor_id uuid references auth.users,action text not null,subject_id text,metadata jsonb not null default '{}',created_at timestamptz not null default now());
create table public.user_spending_policies (id uuid primary key default gen_random_uuid(),business_id uuid not null unique references public.businesses,per_payment_usd numeric(20,2) not null check(per_payment_usd>0),daily_usd numeric(20,2) not null check(daily_usd>0),block_critical boolean not null default true check(block_critical),manual_high_risk boolean not null default true check(manual_high_risk),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
-- Atomic spending reservations are a prerequisite of the future funded coordinator.
create table public.spending_reservations (id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses,transaction_id uuid not null unique references public.transactions,usd_value numeric(20,2) not null check(usd_value>0),state text not null check(state in('reserved','settled','released')),expires_at timestamptz not null,created_at timestamptz not null default now());
alter table public.users enable row level security;
create policy own_user_select on public.users for select to authenticated using(id=auth.uid());
create policy own_user_insert on public.users for insert to authenticated with check(id=auth.uid());
create policy own_user_update on public.users for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
alter table public.businesses enable row level security;
create policy business_select on public.businesses for select to authenticated using(public.is_business_member(id));
create policy business_update on public.businesses for update to authenticated using(public.can_manage_business(id)) with check(public.can_manage_business(id));
alter table public.business_members enable row level security;
create policy memberships_select on public.business_members for select to authenticated using(public.is_business_member(business_id));
-- No membership writes from browsers: invitation service must validate roles.
do $$declare t text;begin
 foreach t in array array['suppliers','wallet_addresses','invoices','payment_quotes','transactions','security_scans','risk_assessments','threat_intelligence_references','security_alerts','audit_logs','user_spending_policies','spending_reservations'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy tenant_read on public.%I for select to authenticated using(public.is_business_member(business_id))',t);
 end loop;
 foreach t in array array['suppliers','wallet_addresses','user_spending_policies'] loop
 execute format('create policy owner_insert on public.%I for insert to authenticated with check(public.can_manage_business(business_id))',t);
 execute format('create policy owner_update on public.%I for update to authenticated using(public.can_manage_business(business_id)) with check(public.can_manage_business(business_id))',t);
 end loop;
end$$;
-- Invoice paid status, quotes, transactions, scan evidence and audit logs are server-write only.
-- Browser users cannot forge settlement or modify historical evidence.
create function public.create_business(business_name text) returns uuid language plpgsql security definer set search_path = public as $$declare created uuid;begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 insert into public.businesses(name) values(business_name) returning id into created;
 insert into public.business_members(business_id,user_id,role) values(created,auth.uid(),'owner');
 insert into public.user_spending_policies(business_id,per_payment_usd,daily_usd) values(created,1000,5000);
 return created;
end$$;
revoke all on function public.create_business(text) from public;
grant execute on function public.create_business(text) to authenticated;
create function public.record_business_write() returns trigger language plpgsql security definer set search_path = public as $$begin
 insert into public.audit_logs(business_id,actor_id,action,subject_id,metadata) values(new.business_id,auth.uid(),tg_table_name||':'||tg_op,new.id::text,jsonb_build_object('table',tg_table_name));return new;
end$$;
revoke all on function public.record_business_write() from public;
do $$declare t text;begin foreach t in array array['suppliers','wallet_addresses','invoices','payment_quotes','transactions','user_spending_policies'] loop
 execute format('create trigger business_write_audit after insert or update on public.%I for each row execute function public.record_business_write()',t);
 end loop;end$$;
commit;
