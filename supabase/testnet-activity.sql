-- Additive 0.9.2 migration. Preserves all invoices, balances and payments.
-- Shared records contain only public, server-verified native testnet chain facts.
create table if not exists public.testnet_transfers (
 hash text primary key check(hash ~ '^[1-9A-HJ-NP-Za-km-z]{32,64}$'),
 sender text not null check(sender like '%.testnet'),
 receiver text not null check(receiver like '%.testnet'),
 amount_atomic text not null check(amount_atomic ~ '^[0-9]+$' and amount_atomic::numeric>0 and amount_atomic::numeric<=1000000000000000000000000),
 block_height bigint not null check(block_height>0),
 block_timestamp timestamptz not null,
 verified_at timestamptz not null,
 provider text not null,
 check(sender<>receiver)
);
create index if not exists testnet_transfer_sender on public.testnet_transfers(sender,block_timestamp desc);
create index if not exists testnet_transfer_receiver on public.testnet_transfers(receiver,block_timestamp desc);
alter table public.testnet_transfers enable row level security;
revoke all on public.testnet_transfers from anon,authenticated;
grant select,insert on public.testnet_transfers to service_role;
comment on table public.testnet_transfers is 'Public chain facts only. No private invoice descriptions, account email, owner IDs or wallet secrets. Authenticated server queries return matching wallet activity; knowing an address does not prove ownership.';
