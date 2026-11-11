-- Small payment-flow patch. Run after mainnet-transfers.sql. Preserves all records and spending limits.
begin;
create or replace function public.afripay_live_reserve(p_user uuid,p_id uuid,p_input jsonb,p_quote jsonb,p_risk jsonb,p_expires timestamptz)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare old public.live_payment_orders;pol public.live_spending_policies;cost numeric;total numeric;req public.live_payment_requests;previous_state text;repeat_order public.live_payment_orders;
begin
 insert into public.live_spending_policies(user_id)values(p_user)on conflict do nothing;
 select * into pol from public.live_spending_policies where user_id=p_user for update;
 if exists(select 1 from public.bsc_transfer_orders where user_id=p_user and lower(trim(invoice_reference))=lower(trim(p_input->>'invoiceReference'))and state<>'EXPIRED')then raise exception 'This reference already has a BSC payment; check it before paying on NEAR';end if;
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
 if exists(select 1 from public.live_payment_orders where user_id=p_user and sender=p_input->>'sender' and recipient=p_input->>'recipient' and destination_asset=p_input->>'destinationAsset' and amount_out=p_quote->'quoteRequest'->>'amount' and created_at>now()-interval '10 minutes' and state not in('EXPIRED','REFUNDED') and(repeat_order.id is null or state<>'SUCCESS'))then raise exception 'Matching recent live payment exists. Check its history before retrying';end if;
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
commit;
