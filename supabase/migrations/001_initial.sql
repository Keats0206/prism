-- SMS Mutual Agent MVP schema

create type trust_level as enum (
  'remember',
  'draft_only',
  'ask_first',
  'auto_coordinate'
);

create type relationship_status as enum (
  'pending',
  'connected',
  'blocked'
);

create type thread_kind as enum (
  'owner',
  'participant'
);

create type message_direction as enum (
  'inbound',
  'outbound'
);

create type pending_action_status as enum (
  'pending',
  'approved',
  'rejected',
  'expired',
  'executed'
);

create type pending_action_type as enum (
  'send_sms'
);

create table users (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text,
  opted_out boolean not null default false,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id) on delete cascade,
  phone text not null,
  name text not null,
  notes text,
  linked_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, phone)
);

create index contacts_owner_name_idx on contacts (owner_user_id, lower(name));

create table relationships (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references users(id) on delete cascade,
  user_b_id uuid not null references users(id) on delete cascade,
  status relationship_status not null default 'pending',
  trust_level trust_level not null default 'ask_first',
  shared_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_a_id, user_b_id),
  check (user_a_id < user_b_id)
);

create table threads (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references users(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  participant_phone text not null,
  kind thread_kind not null default 'owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index threads_participant_phone_idx on threads (participant_phone);
create index threads_owner_user_id_idx on threads (owner_user_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references threads(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  direction message_direction not null,
  body text not null,
  twilio_sid text,
  created_at timestamptz not null default now()
);

create index messages_thread_created_idx on messages (thread_id, created_at desc);

create table pending_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  action_type pending_action_type not null,
  payload jsonb not null,
  draft_reply text,
  status pending_action_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pending_actions_user_status_idx on pending_actions (user_id, status);
