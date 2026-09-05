-- Little Wonders platform schema. Applied with `supabase db push` (see docs/PLATFORM.md).
-- Design: the browser never talks to these tables directly. Row Level Security is on with no
-- policies, so only the service role (used by the edge functions) can read or write.

create extension if not exists pgcrypto;

-- One row per household. The code is the only credential; the email exists so we can send the
-- code back and so Stripe payments can be matched to a family.
create table public.families (
  id                      uuid primary key default gen_random_uuid(),
  code                    text not null unique check (code ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  email                   text,
  created_at              timestamptz not null default now(),
  last_seen_at            timestamptz not null default now(),
  supporter_until         timestamptz,            -- active supporter while this is in the future
  plan                    text check (plan in ('month', 'year')),
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  subscription_status     text                    -- last status Stripe told us (active, past_due, canceled, ...)
);
create index families_email_idx on public.families (lower(email));

-- Synced progress: one JSON blob per (family, game). Merge rules live in engine/save.js (client) and
-- the edge function keeps the newest updatedAt.
create table public.progress (
  family_id   uuid not null references public.families (id) on delete cascade,
  game_id     text not null check (game_id ~ '^[a-z0-9_-]{1,32}$'),
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  primary key (family_id, game_id)
);

-- Anonymous play counter: one increment per device per game per day, no identifiers.
create table public.plays (
  day      date not null,
  game_id  text not null check (game_id ~ '^[a-z0-9_-]{1,32}$'),
  count    integer not null default 0,
  primary key (day, game_id)
);

-- Stripe webhook idempotency: an event id we have already processed is ignored.
create table public.stripe_events (
  id           text primary key,
  type         text not null,
  received_at  timestamptz not null default now()
);

alter table public.families      enable row level security;
alter table public.progress      enable row level security;
alter table public.plays         enable row level security;
alter table public.stripe_events enable row level security;

-- Atomic play increment used by the edge function.
create or replace function public.increment_play(p_game text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.plays (day, game_id, count) values (current_date, p_game, 1)
  on conflict (day, game_id) do update set count = plays.count + 1;
$$;
revoke execute on function public.increment_play(text) from public, anon, authenticated;

-- Dashboard views (query them in the Supabase SQL editor).
create view public.supporter_summary as
select
  count(*) filter (where supporter_until > now())                        as active_supporters,
  count(*) filter (where supporter_until > now() and plan = 'month')      as monthly,
  count(*) filter (where supporter_until > now() and plan = 'year')       as yearly,
  count(*) filter (where supporter_until > now() and plan = 'month') * 2.00
    + count(*) filter (where supporter_until > now() and plan = 'year') * (10.00 / 12) as mrr_usd,
  count(*)                                                                as families,
  count(*) filter (where last_seen_at > now() - interval '30 days')       as families_active_30d
from public.families;

create view public.plays_by_week as
select date_trunc('week', day)::date as week, game_id, sum(count) as plays
from public.plays group by 1, 2 order by 1 desc, 3 desc;
