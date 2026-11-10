-- Additive migration. Run in Supabase SQL Editor. TESTNET ONLY; no DUSD/mainnet writes.
create table if not exists public.testnet_invoices (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 reference text not null check(length(reference) between 1 and 80),
 receiver text not null check(receiver like '%.testnet'),
 amount text not null,
 description text not null default '',
 min_block_height bigint not null check(min_block_height>=0),
 state text not null default 'OPEN' check(state in ('OPEN','AUTHORIZING','SUBMITTED','PAID','FAILED')),
 sender text check(sender like '%.testnet'),
 funding_hash text unique,
 proof jsonb,
 created_at timestamptz not null default now(),
 paid_at timestamptz,
 unique(user_id,reference),
 check(state='OPEN' or sender is not null),
 check(state not in ('SUBMITTED','PAID','FAILED') or funding_hash is not null),
 check(state<>'PAID' or (proof is not null and paid_at is not null))
);
alter table public.testnet_invoices enable row level security;
drop policy if exists testnet_invoice_owner_read on public.testnet_invoices;
create policy testnet_invoice_owner_read on public.testnet_invoices for select to authenticated using(auth.uid()=user_id);
revoke all on public.testnet_invoices from anon,authenticated;
grant select on public.testnet_invoices to authenticated;
grant all on public.testnet_invoices to service_role;
comment on table public.testnet_invoices is 'Private native NEAR testnet invoices. Service verifies final RPC execution, immutable transfer fields and post-creation block height. Not mainnet or cross-chain settlement.';
