-- Account-owned DEMO documents. Run in SQL Editor; safe to run again.
-- These user-editable simulation records are NOT an immutable financial audit ledger.
begin;
create table if not exists public.demo_workspaces(
 user_id uuid primary key references auth.users(id) on delete cascade,
 snapshot jsonb not null check(jsonb_typeof(snapshot)='object'),
 revision integer not null default 1 check(revision>0),
 updated_at timestamptz not null default now()
);
alter table public.demo_workspaces enable row level security;
revoke all on public.demo_workspaces from anon,authenticated;
grant select on public.demo_workspaces to authenticated;
drop policy if exists demo_workspace_owner on public.demo_workspaces;
create policy demo_workspace_owner on public.demo_workspaces for select to authenticated using(user_id=auth.uid());
create or replace function public.afripay_save_demo_workspace(p_snapshot jsonb,p_expected_revision integer)
returns setof public.demo_workspaces language plpgsql security definer set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid();
begin
 if owner_id is null then raise exception 'Sign in required' using errcode='42501';end if;
 if p_expected_revision is null or p_expected_revision<0 then raise exception 'Invalid revision';end if;
 if p_snapshot is null or jsonb_typeof(p_snapshot)<>'object' or octet_length(p_snapshot::text)>2000000 then raise exception 'Invalid simulation document';end if;
 if not(p_snapshot ?& array['invoices','suppliers','payments','events','audits','policy','business','owner','currency']) then raise exception 'Incomplete simulation document';end if;
 if p_snapshot->>'currency'<>'USD' or jsonb_typeof(p_snapshot->'policy')<>'object' then raise exception 'Invalid simulation settings';end if;
 if exists(select 1 from unnest(array['invoices','suppliers','payments','events','audits']) k where jsonb_typeof(p_snapshot->k)<>'array') then raise exception 'Invalid simulation lists';end if;
 if exists(select 1 from jsonb_array_elements(p_snapshot->'payments') p where p->>'mode' is distinct from 'demo' or p->>'status' is null or p->>'status' not in('Pending approval','Processing (demo)','Settled (demo)','Failed (demo)','Refunded (demo)')) then raise exception 'Only simulated payment records are allowed';end if;
 if exists(select 1 from jsonb_array_elements(p_snapshot->'audits') a where a->>'mode' is distinct from 'demo') then raise exception 'Only simulated audit records are allowed';end if;
 if p_expected_revision=0 then
  return query insert into public.demo_workspaces(user_id,snapshot,revision) values(owner_id,p_snapshot,1) on conflict(user_id) do nothing returning *;
 else
  return query update public.demo_workspaces set snapshot=p_snapshot,revision=demo_workspaces.revision+1,updated_at=now()
  where user_id=owner_id and revision=p_expected_revision returning *;
 end if;
 -- A missing row with a nonzero revision indicates stale state, not a new document.
 if not found then raise exception 'Workspace revision conflict. Reload saved changes.' using errcode='40001';end if;
end$$;
revoke all on function public.afripay_save_demo_workspace(jsonb,integer) from public,anon;
grant execute on function public.afripay_save_demo_workspace(jsonb,integer) to authenticated;
commit;
