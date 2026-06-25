-- Waitlist gate: the full agent (matching, intros, plans, events) is gated
-- behind early access. New users land in a `waitlist` state where the agent
-- only onboards them — learning their goals, lanes, and location to capture
-- signal — and the "real" capabilities stay locked until they're `granted`.
--
-- `interview_completed_at` marks the moment the agent decided it had learned
-- enough (at least one lane + a location) and showed the waitlist confirmation.
-- It's distinct from `onboarded_at` (which marks account creation).

alter table users
  add column if not exists access_status text not null default 'waitlist'
    check (access_status in ('waitlist', 'granted')),
  add column if not exists interview_completed_at timestamptz;

create index if not exists users_access_status_idx on users (access_status);
