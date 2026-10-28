-- MiPo core schema (v1: no auth, single user — see sketch-findings-mipo skill
-- for the design decisions this implements).
--
-- Run this once in your Supabase project's SQL Editor
-- (Project → SQL Editor → New query → paste → Run).

create table if not exists leave_types (
  id uuid primary key default gen_random_uuid(),
  label_he text not null,
  color_key text not null, -- must match a --leave-<color_key> token in app/globals.css
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Enforced at the DB layer (not just the comment above): adding a leave type
-- with a color_key that has no matching CSS token would otherwise render a
-- chip with no visible color and no error anywhere. Add the new key to
-- app/globals.css (and this list) together, in the same change.
alter table leave_types drop constraint if exists leave_types_color_key_check;
alter table leave_types add constraint leave_types_color_key_check
  check (color_key in ('vacation', 'medical', 'other', 'green', 'teal', 'rose'));

-- Whether a request of this type should still show on the Friday/Saturday
-- columns of the week-grid (e.g. reserve duty applies every day; office-only
-- errands don't). Defaults to true so existing types keep today's behavior.
alter table leave_types add column if not exists weekend_applicable boolean not null default true;

create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_name text not null,
  leave_type_id uuid not null references leave_types(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  constraint end_after_start check (end_date >= start_date)
);

-- Free-text reason for the request (optional) and an approval workflow.
-- v1 has one "admin" user with full read/write access to everything,
-- including setting status — this is just the data shape for that workflow,
-- not permission-gated yet. Once real per-user permissions exist, that's
-- enforced elsewhere (RLS policies / app logic), not by changing this schema.
alter table leave_requests add column if not exists reason text;

-- One-time migration: on a database that doesn't have `status` yet, requests
-- created before the approval workflow existed were implicitly "approved" (the
-- week-grid showed everything unconditionally). Back those rows over to
-- 'approved' so they don't vanish from the week-grid the moment this ships —
-- but only on that first add, so re-running this script never resets a real
-- pending/denied decision someone has since made.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'leave_requests' and column_name = 'status'
  ) then
    alter table leave_requests add column status text not null default 'pending';
    update leave_requests set status = 'approved';
  end if;
end $$;

alter table leave_requests drop constraint if exists leave_requests_status_check;
alter table leave_requests add constraint leave_requests_status_check
  check (status in ('pending', 'approved', 'denied'));

create index if not exists leave_requests_date_range_idx
  on leave_requests (start_date, end_date);

-- Soft delete: deleting a request sets this instead of removing the row, so
-- a delete can be undone with a short "בטל" toast. Rows with a non-null
-- deleted_at are excluded from every fetch.
alter table leave_requests add column if not exists deleted_at timestamptz;

-- RLS: enabled with an explicit "anon can do everything" policy. There's no
-- auth yet (v1 is single-user, talking to Supabase directly with the anon
-- key), so this behaves the same as RLS-off today — but it's visible/auditable
-- instead of an implicit gap, and it's the right shape to tighten once real
-- auth exists: swap `using (true)` for a check against the authenticated
-- user before deploying anywhere reachable by others.

alter table leave_types enable row level security;
alter table leave_requests enable row level security;

drop policy if exists "anon full access (v1, no auth yet)" on leave_types;
create policy "anon full access (v1, no auth yet)" on leave_types
  for all
  to anon
  using (true)
  with check (true);

drop policy if exists "anon full access (v1, no auth yet)" on leave_requests;
create policy "anon full access (v1, no auth yet)" on leave_requests
  for all
  to anon
  using (true)
  with check (true);
