-- Memory, AI cards, live events/location, and richer profiles.
--
-- This milestone evolves Mutual from a pure coordinator into an agent that
-- remembers facts about you and your friends (with per-fact visibility), can
-- attach rich cards to web chat replies, pulls live local events keyed on your
-- location, and carries a fuller profile + intent settings.

-- 1. MEMORY + PER-FACT VISIBILITY ------------------------------------------
-- A memory lives in one user's store (user_id = owner). subject_user_id is who
-- the fact is ABOUT: null means it's about the owner themselves, or about a
-- non-user contact (the contact's name is baked into `content`). visibility
-- governs whether the owner's agent may surface the fact TO another user.
do $$ begin
  create type memory_visibility as enum ('private', 'friends', 'public');
exception when duplicate_object then null; end $$;

do $$ begin
  create type memory_source as enum ('user_stated', 'agent_inferred', 'onboarding');
exception when duplicate_object then null; end $$;

create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  subject_user_id uuid references users(id) on delete set null,
  content text not null,
  visibility memory_visibility not null default 'private',
  source memory_source not null default 'user_stated',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memories_user_idx on memories (user_id, created_at desc);
create index if not exists memories_subject_idx on memories (subject_user_id);

-- 2. AI UI CARDS — stored as message metadata -----------------------------
-- Discriminated-union card payload (event/event_list/plan/profile). Null for
-- plain text messages. Mirrors how pending_actions.payload carries jsonb.
alter table messages add column if not exists card jsonb;

-- 3. LIVE EVENTS + LOCATION -----------------------------------------------
alter table users add column if not exists lat double precision;
alter table users add column if not exists lng double precision;
alter table users add column if not exists city text;
alter table users add column if not exists location_updated_at timestamptz;

-- 4. PROFILE + INTENTS -----------------------------------------------------
-- Richer profile reuses the existing users.answers jsonb; bio is the one new
-- free-text field. intents shape: { intros?, dating?, work?, friendship? }.
alter table users add column if not exists bio text;
alter table users add column if not exists intents jsonb not null default '{}'::jsonb;
