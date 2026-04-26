-- HandstandHub entitlements
-- Server-side source of truth for "is this user allowed Pro features?"
-- The client must NEVER trust its local AsyncStorage purchase state.
--
-- Run in Supabase SQL editor or via:
--   supabase db push

-- ──────────────────────────────────────────────────────────────────────────────
-- SUBSCRIPTIONS — one row per active or historical sub. Written by RevenueCat
-- webhook (or by a server-side function during the beta mock flow).
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  status              text not null check (status in ('trialing','active','past_due','canceled','expired')),
  product_id          text,                       -- 'pro_monthly' | 'pro_annual'
  trial_started_at    timestamptz,
  trial_ends_at       timestamptz,
  current_period_end  timestamptz,
  source              text not null default 'mock', -- 'mock' | 'revenuecat' | 'apple' | 'google'
  raw                 jsonb,                       -- raw webhook payload for debugging
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Users may read only their own rows. NO insert/update from the client — those
-- only come in via service-role webhooks.
create policy "Users read own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- ENTITLEMENTS view — single boolean answer to "does this user have Pro?"
-- Used by Edge Functions (ai-check, check-entitlement) and by the client UI.
-- A user is entitled if any subscription row has status='active' OR
-- (status='trialing' AND trial_ends_at > now()).
-- ──────────────────────────────────────────────────────────────────────────────
create or replace view public.entitlements
with (security_invoker = true)
as
select
  u.id as user_id,
  exists (
    select 1 from public.subscriptions s
    where s.user_id = u.id
      and (
        s.status = 'active'
        or (s.status = 'trialing' and s.trial_ends_at > now())
      )
  ) as is_active,
  (
    select max(s.trial_ends_at) from public.subscriptions s
    where s.user_id = u.id and s.status = 'trialing'
  ) as trial_ends_at,
  (
    select max(s.current_period_end) from public.subscriptions s
    where s.user_id = u.id and s.status = 'active'
  ) as current_period_end
from public.users u;

grant select on public.entitlements to authenticated;

-- ──────────────────────────────────────────────────────────────────────────────
-- start_trial RPC — beta mock for "Start free trial" tap. In production this
-- gets replaced by a RevenueCat webhook. For now, the client calls this RPC
-- directly. It can only start a trial for the calling user, and only once.
-- ──────────────────────────────────────────────────────────────────────────────
create or replace function public.start_trial(p_product_id text)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id  uuid := auth.uid();
  v_existing public.subscriptions;
  v_new      public.subscriptions;
begin
  if v_user_id is null then
    raise exception 'unauthorized';
  end if;

  -- Refuse if a trial has already been started (even if expired) — one trial per user.
  select * into v_existing
  from public.subscriptions
  where user_id = v_user_id and trial_started_at is not null
  limit 1;
  if found then
    return v_existing;
  end if;

  insert into public.subscriptions (user_id, status, product_id, trial_started_at, trial_ends_at, source)
  values (v_user_id, 'trialing', p_product_id, now(), now() + interval '7 days', 'mock')
  returning * into v_new;

  return v_new;
end;
$$;

revoke all on function public.start_trial(text) from public;
grant execute on function public.start_trial(text) to authenticated;
