-- Focused invoice inbox and notification patch. Run after network-suppliers.sql and separate-payment.sql.
begin;
grant select on public.network_supplier_applications to service_role;
create or replace function public.afripay_create_payment_request(p_user uuid,p_id uuid,p_token text,p_data jsonb,p_asset jsonb)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare row public.live_payment_requests;
begin
 -- Serialize publication by owner to enforce a bounded open-link count.
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into row from public.live_payment_requests where id=p_id;
 if found then if row.owner_id<>p_user or row.data<>p_data then raise exception 'Invoice publication ID reused';end if;return to_jsonb(row);end if;
 if p_token is null or p_token!~'^[a-f0-9]{64}$'or p_data is null or p_asset is null then raise exception 'Invalid public request';end if;
 if (select count(*)from public.live_payment_requests r where r.owner_id=p_user and r.state='OPEN'and r.expires_at>now() and not exists(select 1 from public.live_payment_orders o where r.bound_route='NEAR' and o.id=r.bound_order and o.state='SUCCESS' and o.evidence->>'verified'='true' and o.settled_at is not null) and not exists(select 1 from public.bsc_transfer_orders o where r.bound_route='BSC' and o.id=r.bound_order and o.state='SUCCESS' and o.evidence->>'verified'='true' and o.settled_at is not null))>=20 then raise exception 'At most 20 active invoice links';end if;
 insert into public.live_payment_requests(id,owner_id,token,data,asset_metadata)values(p_id,p_user,p_token,p_data,p_asset)returning * into row;return to_jsonb(row);
end$$;
-- A published invoice is identified by its immutable token, not a globally unique human invoice number.
-- Manual transfer references retain their duplicate guard.
drop index if exists public.live_invoice_once;
create unique index live_invoice_once on public.live_payment_orders(user_id,coalesce(input->>'requestToken','manual:'||lower(trim(invoice_reference)))) where state not in('EXPIRED','REFUNDED');
drop index if exists public.bsc_invoice_once;
create unique index bsc_invoice_once on public.bsc_transfer_orders(user_id,coalesce(input->>'requestToken','manual:'||lower(trim(invoice_reference)))) where state<>'EXPIRED';
create or replace function public.afripay_live_reserve(p_user uuid,p_id uuid,p_input jsonb,p_quote jsonb,p_risk jsonb,p_expires timestamptz)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare old public.live_payment_orders;pol public.live_spending_policies;cost numeric;total numeric;req public.live_payment_requests;previous_state text;repeat_order public.live_payment_orders;
begin
 insert into public.live_spending_policies(user_id)values(p_user)on conflict do nothing;
 select * into pol from public.live_spending_policies where user_id=p_user for update;
 if exists(select 1 from public.bsc_transfer_orders where user_id=p_user and lower(trim(invoice_reference))=lower(trim(p_input->>'invoiceReference'))and state<>'EXPIRED' and(p_input->>'requestToken' is null or input->>'requestToken' is not distinct from p_input->>'requestToken'))then raise exception 'This reference already has a BSC payment; check it before paying on NEAR';end if;
 if p_input ? 'requestToken' then
  select * into req from public.live_payment_requests where token=p_input->>'requestToken' for update;
  if not found or req.state<>'OPEN' or req.expires_at<=now()then raise exception 'Invoice link unavailable or expired';end if;
  if exists(select 1 from unnest(array['recipient','destinationAsset','destinationChain','amount','invoiceReference','invoiceText'])k where req.data->>k is distinct from p_input->>k)then raise exception 'Payment details differ from the published invoice';end if;
  if req.bound_order is not null and req.bound_order<>p_id then
   if req.bound_route='BSC' then select state into previous_state from public.bsc_transfer_orders where id=req.bound_order;else select state into previous_state from public.live_payment_orders where id=req.bound_order;end if;
   if previous_state not in('EXPIRED','REFUNDED') or previous_state is null then raise exception 'Invoice already has a payment in progress or settled';end if;
  end if;
 end if;
 select * into old from public.live_payment_orders where id=p_id;
 if found then if old.user_id<>p_user or old.input<>p_input then raise exception 'Approval ID already used for different details';end if;return to_jsonb(old);end if;
 if p_id is null or p_input is null or p_quote is null or p_risk is null or p_expires<=now() or (p_risk->>'blocked')::boolean or (p_risk->>'score')::int >=80 then raise exception 'Invalid or blocked live payment';end if;
 if p_input ? 'repeatOf' then
  select * into repeat_order from public.live_payment_orders where id=(p_input->>'repeatOf')::uuid and user_id=p_user and state='SUCCESS' and evidence->>'verified'='true';
  if not found or p_input->>'repeatConfirmed' is distinct from 'true' or repeat_order.sender is distinct from p_input->>'sender' or repeat_order.recipient is distinct from p_input->>'recipient' or repeat_order.destination_asset is distinct from p_input->>'destinationAsset' or repeat_order.destination_chain is distinct from p_input->>'destinationChain' or lower(trim(repeat_order.invoice_reference))=lower(trim(p_input->>'invoiceReference')) or p_input ? 'requestToken' then raise exception 'A separate payment requires a verified prior payment, new reference and explicit confirmation';end if;
 elsif p_input ? 'repeatConfirmed' then raise exception 'Prior paid order required';end if;
 if exists(select 1 from public.live_payment_orders where user_id=p_user and sender=p_input->>'sender' and recipient=p_input->>'recipient' and destination_asset=p_input->>'destinationAsset' and amount_out=p_quote->'quoteRequest'->>'amount' and created_at>now()-interval '10 minutes' and state not in('EXPIRED','REFUNDED') and(repeat_order.id is null or state<>'SUCCESS') and not(state='SUCCESS' and req.id is not null and input->>'requestToken' is distinct from req.token))then raise exception 'Matching recent live payment exists. Check its history before retrying';end if;
 cost:=(p_quote->'quote'->>'amountIn')::numeric;
 if cost<=0 or cost>pol.single_near*1e24 then raise exception 'Live per-payment NEAR limit exceeded';end if;
 update public.live_payment_orders set state='EXPIRED',updated_at=now() where user_id=p_user and state='QUOTED' and expires_at<=now();
 select coalesce(sum(max_input::numeric),0)into total from public.live_payment_orders where user_id=p_user and (created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC' or state in('COMMITTING','COMMITTED','AUTHORIZING','SUBMITTED','PENDING_DEPOSIT','KNOWN_DEPOSIT_TX','PROCESSING','INCOMPLETE_DEPOSIT','NEEDS_RECONCILIATION','FAILED')) and state not in('EXPIRED','REFUNDED');
 if cost+total>pol.daily_near*1e24 then raise exception 'Live daily NEAR limit exceeded';end if;
 -- Only uncommitted, never-authorized quotes can expire automatically.
 insert into public.live_payment_orders(id,user_id,input,sender,recipient,destination_asset,destination_chain,invoice_reference,amount_out,max_input,dry_quote,risk,expires_at)
 values(p_id,p_user,p_input,p_input->>'sender',p_input->>'recipient',p_input->>'destinationAsset',p_input->>'destinationChain',p_input->>'invoiceReference',p_quote->'quoteRequest'->>'amount',cost::text,p_quote,p_risk,p_expires) returning * into old;
 update public.live_payment_orders set asset_metadata=p_quote->'assetMetadata',payment_request_id=req.id where id=p_id returning * into old;
 if req.id is not null then update public.live_payment_requests set bound_order=p_id,bound_route='NEAR' where id=req.id;end if;
 insert into public.live_payment_events(order_id,user_id,event,detail)values(p_id,p_user,'Dry quote reviewed',p_risk);
 return to_jsonb(old);
end$$;
create or replace function public.afripay_bsc_reserve(p_user uuid,p_id uuid,p_input jsonb,p_review jsonb)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.bsc_transfer_orders;req public.live_payment_requests;old_state text;total numeric;atomic numeric;
begin
 insert into public.live_spending_policies(user_id)values(p_user)on conflict do nothing;perform 1 from public.live_spending_policies where user_id=p_user for update;
 insert into public.bsc_spending_locks values(p_user)on conflict do nothing;perform 1 from public.bsc_spending_locks where user_id=p_user for update;
 select * into r from public.bsc_transfer_orders where id=p_id;
 if found then if r.user_id<>p_user or r.input<>p_input then raise exception 'Review ID changed';end if;return to_jsonb(r);end if;
 if exists(select 1 from public.live_payment_orders where user_id=p_user and lower(trim(invoice_reference))=lower(trim(p_input->>'invoiceReference'))and state not in('EXPIRED','REFUNDED') and(p_input->>'requestToken' is null or input->>'requestToken' is not distinct from p_input->>'requestToken'))then raise exception 'This reference already has a NEAR payment; check it before paying on BSC';end if;
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
 if exists(select 1 from public.bsc_transfer_orders where user_id=p_user and sender=lower(p_input->>'sender') and recipient=lower(p_input->>'recipient') and asset=p_input->>'destinationAsset' and amount_atomic::numeric=atomic and created_at>now()-interval '10 minutes' and state<>'EXPIRED' and not(state='SUCCESS' and req.id is not null and input->>'requestToken' is distinct from req.token))then raise exception 'Matching BSC transfer exists; check history before retrying';end if;
 select coalesce(sum(amount_atomic::numeric),0) into total from public.bsc_transfer_orders where user_id=p_user and asset=p_input->>'destinationAsset' and state<>'EXPIRED' and(created_at>=date_trunc('day',now() at time zone 'UTC')at time zone 'UTC' or state in('AUTHORIZING','SUBMITTED','FAILED'));
 if total+atomic>30000000000000000000 then raise exception 'BSC daily limit is 30 tokens per asset';end if;
 insert into public.bsc_transfer_orders(id,user_id,input,review,sender,recipient,asset,amount_atomic,invoice_reference)values(p_id,p_user,p_input,p_review,lower(p_input->>'sender'),lower(p_input->>'recipient'),p_input->>'destinationAsset',atomic::text,p_input->>'invoiceReference')returning * into r;
 if req.id is not null then update public.live_payment_requests set bound_order=p_id,bound_route='BSC' where id=req.id;end if;return to_jsonb(r);
end$$;
create table if not exists public.business_invoices(
 id uuid primary key references public.live_payment_requests(id),issuer_id uuid not null references auth.users(id),payer_id uuid not null references auth.users(id),
 issuer_supplier_id uuid not null references public.network_supplier_applications(id),payer_supplier_id uuid not null references public.network_supplier_applications(id),
 issuer_name text not null,payer_name text not null,created_at timestamptz not null default now(),check(issuer_id<>payer_id)
);
alter table public.business_invoices enable row level security;
revoke all on public.business_invoices from anon,authenticated;grant select on public.business_invoices to authenticated;grant all on public.business_invoices to service_role;
drop policy if exists business_participants on public.business_invoices;
create policy business_participants on public.business_invoices for select to authenticated using(issuer_id=auth.uid()or payer_id=auth.uid());
create index if not exists business_invoice_inbox on public.business_invoices(payer_id,created_at desc);
create table if not exists public.account_notifications(
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id),event_key text not null,
 kind text not null check(kind in('payment_sent','payment_received','invoice_received','invoice_delivered','invoice_paid')),
 title text not null,body text not null,href text not null,read_at timestamptz,created_at timestamptz not null default now(),unique(owner_id,event_key)
);
alter table public.account_notifications enable row level security;
revoke all on public.account_notifications from anon,authenticated;grant select on public.account_notifications to authenticated;grant all on public.account_notifications to service_role;
drop policy if exists own_notifications on public.account_notifications;
create policy own_notifications on public.account_notifications for select to authenticated using(owner_id=auth.uid());
create index if not exists account_notification_inbox on public.account_notifications(owner_id,created_at desc);
create or replace function public.afripay_deliver_invoice(p_user uuid,p_id uuid,p_token text,p_payer uuid,p_data jsonb,p_asset jsonb)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare issuer public.network_supplier_applications;payer public.network_supplier_applications;r public.live_payment_requests;b public.business_invoices;
begin
 -- Lock registry snapshots in deterministic order so simultaneous issuance cannot deadlock.
 perform 1 from public.network_supplier_applications where (owner_id=p_user and network='mainnet')or id=p_payer order by id for share;
 select * into issuer from public.network_supplier_applications where owner_id=p_user and network='mainnet' and status='approved';
 select * into payer from public.network_supplier_applications where id=p_payer and network='mainnet' and status='approved';
 if issuer.id is null or payer.id is null or issuer.owner_id=payer.owner_id then raise exception 'Choose two distinct approved mainnet businesses';end if;
 select * into b from public.business_invoices where id=p_id;
 if found then
  select * into r from public.live_payment_requests where id=p_id;
  if b.issuer_id<>p_user or b.payer_supplier_id<>p_payer or r.data<>p_data then raise exception 'Invoice ID was reused with different details';end if;
  return to_jsonb(r);
 end if;
 if p_data->>'recipient' is distinct from issuer.wallet or p_data->>'destinationChain' is distinct from issuer.chain or p_data->>'businessName' is distinct from issuer.business_name or p_asset->>'blockchain' is distinct from issuer.chain or p_asset->>'assetId' is distinct from p_data->>'destinationAsset' then raise exception 'Invoice destination differs from your approved registration';end if;
 -- Stable published request plus private delivery and notifications commit together.
 perform public.afripay_create_payment_request(p_user,p_id,p_token,p_data,p_asset);
 insert into public.business_invoices(id,issuer_id,payer_id,issuer_supplier_id,payer_supplier_id,issuer_name,payer_name)values(p_id,p_user,payer.owner_id,issuer.id,payer.id,issuer.business_name,payer.business_name);
 insert into public.account_notifications(owner_id,event_key,kind,title,body,href)values
 (payer.owner_id,'invoice-received:'||p_id,'invoice_received','New invoice received',issuer.business_name||' sent invoice '||(p_data->>'invoiceReference'),'invoices'),
 (p_user,'invoice-delivered:'||p_id,'invoice_delivered','Invoice delivered','Invoice '||(p_data->>'invoiceReference')||' delivered to '||payer.business_name,'supplier/dashboard')on conflict(owner_id,event_key)do nothing;
 select * into r from public.live_payment_requests where id=p_id;return to_jsonb(r);
end$$;
revoke all on function public.afripay_deliver_invoice(uuid,uuid,text,uuid,jsonb,jsonb)from public,anon,authenticated;
grant execute on function public.afripay_deliver_invoice(uuid,uuid,text,uuid,jsonb,jsonb)to service_role;
create or replace function public.afripay_notify_settlement()returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare o jsonb:=to_jsonb(new);route text;req public.live_payment_requests;b public.business_invoices;dest text;payment_chain text;amount text;symbol text;receiver uuid;
begin
 if o->>'state'<>'SUCCESS' or o->'evidence'->>'verified' is distinct from 'true' or o->>'settled_at' is null then return new;end if;
 route:=case when tg_table_name='bsc_transfer_orders'then 'BSC'else 'NEAR'end;
 dest:=o->>'recipient';payment_chain:=case when route='BSC'then 'bsc'else o->>'destination_chain'end;amount:=o->'input'->>'amount';
 symbol:=case when route='BSC'then case when o->>'asset' like '%55d398%'then 'USDT'else 'USDC'end else coalesce(o->'asset_metadata'->>'symbol',o->'dry_quote'->'assetMetadata'->>'symbol','asset')end;
 insert into public.account_notifications(owner_id,event_key,kind,title,body,href)values((o->>'user_id')::uuid,'sent:'||route||':'||coalesce(o->>'funding_hash',o->>'id'),'payment_sent','Payment sent',coalesce(amount,'')||' '||symbol||' settled to '||dest,'transactions')on conflict(owner_id,event_key)do nothing;
 -- Receipt ownership is explicit for bound invoices; never match an invoice by amount or reference alone.
 select * into req from public.live_payment_requests where bound_order=(o->>'id')::uuid and bound_route=route;
 if found then
  select * into b from public.business_invoices where id=req.id;
  insert into public.account_notifications(owner_id,event_key,kind,title,body,href)values(req.owner_id,'invoice-paid:'||req.id,'invoice_paid','Invoice paid','Invoice '||(req.data->>'invoiceReference')||' has verified settlement.',case when b.id is null then 'receive'else 'supplier/dashboard'end)on conflict(owner_id,event_key)do nothing;
  if b.id is not null then insert into public.account_notifications(owner_id,event_key,kind,title,body,href)values(b.payer_id,'invoice-paid:'||req.id,'invoice_paid','Invoice completed','Invoice '||(req.data->>'invoiceReference')||' is paid.','invoices')on conflict(owner_id,event_key)do nothing;end if;
 end if;
 -- Other registered receiving businesses get public settlement facts, never payer-private invoice text.
 for receiver in select s.owner_id from public.network_supplier_applications s where s.network='mainnet' and s.status='approved' and s.wallet=dest and s.chain=payment_chain union select req.owner_id where req.id is not null loop
  insert into public.account_notifications(owner_id,event_key,kind,title,body,href)values(receiver,'received:'||route||':'||coalesce(o->>'funding_hash',o->>'id'),'payment_received','Payment received',coalesce(amount,'')||' '||symbol||' settled at your registered receiving address.','transactions')on conflict(owner_id,event_key)do nothing;
 end loop;
 return new;
end$$;
revoke all on function public.afripay_notify_settlement()from public,anon,authenticated;
drop trigger if exists native_payment_notifications on public.live_payment_orders;
create trigger native_payment_notifications after insert or update of state,evidence,settled_at on public.live_payment_orders for each row execute function public.afripay_notify_settlement();
drop trigger if exists bsc_payment_notifications on public.bsc_transfer_orders;
create trigger bsc_payment_notifications after insert or update of state,evidence,settled_at on public.bsc_transfer_orders for each row execute function public.afripay_notify_settlement();
-- Rebuild notifications for already-verified records without changing payment facts.
update public.live_payment_orders set evidence=evidence where state='SUCCESS' and evidence->>'verified'='true';
update public.bsc_transfer_orders set evidence=evidence where state='SUCCESS' and evidence->>'verified'='true';
commit;
