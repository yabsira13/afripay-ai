-- 0.9.4: run AFTER live-payment-links.sql. Uses the same NEAR limits, locks and invoice binding as Intents.
begin;
alter table public.live_payment_orders add column if not exists execution_kind text not null default 'INTENTS' check(execution_kind in ('INTENTS','NATIVE_NEAR'));
create or replace function public.afripay_native_reserve(p_user uuid,p_id uuid,p_input jsonb,p_quote jsonb,p_risk jsonb,p_expires timestamptz)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r jsonb;
begin
 if p_input->>'destinationAsset' is distinct from 'native:near' or p_input->>'destinationChain' is distinct from 'near' or p_quote->>'kind' is distinct from 'NATIVE_NEAR' or p_input->>'sender'=p_input->>'recipient' then raise exception 'Invalid native NEAR request';end if;
 if (p_quote->'quote'->>'amountIn')::numeric is null or (p_quote->'quote'->>'amountIn')::numeric<>(p_input->>'amount')::numeric*1e24 or (p_quote->'quote'->>'amountIn')::numeric<>(p_quote->'quote'->>'amountOut')::numeric or (p_quote->'quote'->>'amountIn')::numeric<>(p_quote->'quoteRequest'->>'amount')::numeric or (p_quote->'quote'->>'minAmountOut')::numeric<>(p_quote->'quote'->>'amountOut')::numeric then raise exception 'Native amount changed';end if;
 r:=public.afripay_live_reserve(p_user,p_id,p_input,p_quote,p_risk,p_expires);
 update public.live_payment_orders set execution_kind='NATIVE_NEAR' where id=p_id and user_id=p_user returning to_jsonb(live_payment_orders.*) into r;
 return r;
end$$;
create or replace function public.afripay_native_claim(p_user uuid,p_id uuid)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.live_payment_orders;claim jsonb;
begin
 select * into r from public.live_payment_orders where id=p_id and user_id=p_user;
 if not found or r.execution_kind<>'NATIVE_NEAR' then raise exception 'Native transfer not found';end if;
 -- Reuse policy -> request -> order lock order; the intermediate state is not committed separately.
 claim:=public.afripay_live_claim(p_user,p_id,'commit');
 if not (claim->>'fresh')::boolean then raise exception 'Wallet authorization already claimed; recover the existing hash, do not resend';end if;
 update public.live_payment_orders set state='AUTHORIZING',committed_quote=dry_quote,updated_at=now() where id=p_id and user_id=p_user returning * into r;
 insert into public.live_payment_events(order_id,user_id,event)values(p_id,p_user,'Native NEAR wallet authorization claimed once');return to_jsonb(r);
end$$;
revoke all on function public.afripay_native_reserve(uuid,uuid,jsonb,jsonb,jsonb,timestamptz),public.afripay_native_claim(uuid,uuid)from public,anon,authenticated;
grant execute on function public.afripay_native_reserve(uuid,uuid,jsonb,jsonb,jsonb,timestamptz),public.afripay_native_claim(uuid,uuid)to service_role;
commit;
