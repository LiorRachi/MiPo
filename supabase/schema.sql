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

create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_name text not null,
  leave_type_id uuid not null references leave_types(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  constraint end_after_start check (end_date >= start_date)
);

create index if not exists leave_requests_date_range_idx
  on leave_requests (start_date, end_date);

-- Seed the two leave types confirmed so far. More can now be added/edited/
-- removed from the app itself at /settings — this insert only matters for a
-- fresh database.
insert into leave_types (label_he, color_key, sort_order)
values
  ('חופשה שנתית', 'vacation', 1),
  ('הפניה רפואית', 'medical', 2)
on conflict do nothing;

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
