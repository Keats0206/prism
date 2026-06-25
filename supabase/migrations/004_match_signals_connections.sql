-- Matching engine: structured preferences, double-opt-in connections, funnel.
--
-- This milestone evolves Mutual from a plan coordinator into a matching layer.
-- Instead of the agent drafting and sending a plan, it now captures structured
-- preferences ("signals"), surfaces mutual matches across the trust graph, and
-- brokers consent-gated intros — then lets the two people make their own plans.

-- 1. MATCH SIGNALS — the structured, matchable preference layer ------------
-- `memories` stay freeform (recalled into the owner's prompt). A match_signal is
-- the matchable projection: a lane (which "track" the want is on), a direction
-- (seeking vs offering), a human summary shown in cards, and normalized tags the
-- matcher computes overlap on. Visibility reuses memory_visibility (from 003) so
-- the same cross-user rules apply: `public` is discoverable by anyone, `friends`
-- only by connected friends, `private` only tailors the owner's own suggestions.
do $$ begin
  create type match_lane as enum ('dating', 'work', 'friendship', 'intros');
exception when duplicate_object then null; end $$;

do $$ begin
  create type signal_direction as enum ('seeking', 'offering');
exception when duplicate_object then null; end $$;

create table if not exists match_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  lane match_lane not null,
  direction signal_direction not null default 'seeking',
  summary text not null,
  tags text[] not null default '{}',
  visibility memory_visibility not null default 'friends',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists match_signals_user_idx on match_signals (user_id, lane);
create index if not exists match_signals_tags_idx on match_signals using gin (tags);

-- 2. CONNECTIONS — the double-opt-in intro record -------------------------
-- A connection is created the moment an initiator asks to be introduced. The
-- target is only revealed once BOTH consents are true (status -> 'mutual'). When
-- the target isn't on Mutual yet we stash an invite code on the row; their join
-- + consent resolves the same connection (this is the k-factor surface).
do $$ begin
  create type connection_status as enum ('pending', 'mutual', 'declined', 'expired');
exception when duplicate_object then null; end $$;

create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  lane match_lane not null,
  initiator_user_id uuid not null references users(id) on delete cascade,
  target_user_id uuid references users(id) on delete cascade,
  target_invite_code text,
  context text,
  initiator_consent boolean not null default true,
  target_consent boolean,
  status connection_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (initiator_user_id, target_user_id, lane)
);

create index if not exists connections_initiator_idx on connections (initiator_user_id);
create index if not exists connections_target_idx on connections (target_user_id);
create index if not exists connections_invite_idx on connections (target_invite_code);

-- 3. FUNNEL EVENTS — make k tunable --------------------------------------
-- Lightweight append-only log so the matching funnel
-- (match_surfaced -> connection_requested -> invite_sent -> invite_opened ->
--  target_consented -> mutual) is measurable. Today there's nothing between a
-- send and a manual SQL count; you can't tune k without seeing where it leaks.
create table if not exists funnel_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  name text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists funnel_events_name_idx on funnel_events (name, created_at desc);
