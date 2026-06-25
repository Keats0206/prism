-- Web AI chat channel: profiles, persistent invites, web-linked contacts.
--
-- Mutual is pivoting from SMS-first to a web chat experience. Users now sign up
-- in the browser (phone OTP) and reach friends via a shareable invite link
-- rather than an outbound SMS. These changes let a `users` row carry a full web
-- profile, persist invite codes in the database (previously in-memory), and
-- allow contacts that link to another web user without a known phone number.

-- 1. Web profile fields on users. phone stays the NOT NULL UNIQUE identity.
alter table users add column if not exists email text;
alter table users add column if not exists username text;
alter table users add column if not exists avatar_gradient text;
alter table users add column if not exists answers jsonb not null default '{}'::jsonb;

-- Globally unique @username (case-insensitive) for sharing/mentions.
create unique index if not exists users_username_lower_idx
  on users (lower(username))
  where username is not null;

-- 2. Web-link friends may join before sharing a phone number.
alter table contacts alter column phone drop not null;

-- 3. Persistent invite codes (replaces the in-memory __mutualInvites map).
create table if not exists invites (
  code text primary key,
  creator_user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists invites_creator_idx on invites (creator_user_id);
