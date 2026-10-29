-- MiPo core schema — see sketch-findings-mipo skill for the design decisions
-- this implements.
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
-- Changing status is admin-only (enforced in app/actions.ts via
-- requireAdmin(), and backstopped below by enforce_status_admin_only() since
-- RLS alone can't gate a single column) — see profiles.role below for the
-- admin/employee distinction this and other admin-only actions check.
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

-- Login accounts (admin-created only — see README, there is no public
-- signup). One row per auth.users row, holding the display name and
-- admin/employee role the app needs beyond what Supabase Auth itself stores.
-- Deleting the auth user (via the admin API) cascades here automatically.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null default 'employee',
  created_at timestamptz not null default now()
);

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('admin', 'employee'));

-- Two profiles sharing a display name make every name-keyed lookup ambiguous
-- (attendance-list status, admin request reassignment) — enforced here so
-- that ambiguity can't exist in the first place, rather than every reader of
-- employee_name having to guard against it.
alter table profiles drop constraint if exists profiles_display_name_unique;
alter table profiles add constraint profiles_display_name_unique unique (display_name);

-- The stable identity a request's ownership/visibility checks key off of.
-- employee_name stays as a denormalized display label (many screens read it
-- directly) but is free text — two people can share a display name, and an
-- admin renaming someone would silently orphan their past requests from any
-- name-based filter. profile_id is nullable: a request from before this
-- column existed, or a legacy free-text name with no matching profile, keeps
-- working (visible to admins) but isn't owned by anyone in particular.
alter table leave_requests add column if not exists profile_id uuid references profiles(id) on delete set null;

-- One-time best-effort backfill: link existing rows to a profile when their
-- employee_name matches exactly one profile's display_name. Only runs for
-- rows that don't have a profile_id yet, so re-running this script never
-- undoes a manual reassignment.
update leave_requests lr
set profile_id = p.id
from profiles p
where lr.profile_id is null
  and lr.employee_name = p.display_name
  and (select count(*) from profiles p2 where p2.display_name = lr.employee_name) = 1;

create index if not exists leave_requests_profile_id_idx
  on leave_requests (profile_id);

-- security definer + fixed search_path: lets RLS policies below check the
-- caller's role without each policy repeating the profiles subquery, and
-- without being redefinable by a search_path trick from a non-superuser role.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

alter table profiles enable row level security;

-- The only client-side (RLS-governed) access profiles needs: a logged-in
-- user reading their own role, to decide whether to show them Settings (see
-- lib/auth.ts). Listing every account and all writes go through the
-- service-role client from Settings' server actions instead (see
-- lib/supabase/admin.ts) — gated by that same role check, not by RLS — so no
-- broader policy exists here on purpose.
drop policy if exists "users can read own profile" on profiles;
create policy "users can read own profile" on profiles
  for select
  to authenticated
  using (id = auth.uid());

-- RLS: now that real login exists, every policy below requires an
-- authenticated session — swapped from the old "anon full access" v1
-- policies now that there's something to check against.
--
-- The app layer (app/actions.ts, lib/leave.ts) already enforces who can read
-- or write what, but that only holds for requests that go through our own
-- Server Actions — a logged-in user's own Supabase session can call the
-- REST/JS API directly with their own valid token, bypassing every app-layer
-- check. These policies are the real enforcement; the app-layer checks are
-- just where the user-facing error messages and UX live.

alter table leave_types enable row level security;
alter table leave_requests enable row level security;

drop policy if exists "anon full access (v1, no auth yet)" on leave_types;
drop policy if exists "authenticated full access" on leave_types;

-- Everyone needs to read leave types (the week-grid's legend/rows), but only
-- an admin manages the list itself (Settings → leave types).
drop policy if exists "read all leave types" on leave_types;
create policy "read all leave types" on leave_types
  for select
  to authenticated
  using (true);

drop policy if exists "admin write leave types" on leave_types;
create policy "admin write leave types" on leave_types
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "anon full access (v1, no auth yet)" on leave_requests;
drop policy if exists "authenticated full access" on leave_requests;

-- A non-admin may only see/insert/update their own requests (by profile_id,
-- not the spoofable employee_name text); an admin sees and manages everyone's.
-- A non-admin's write is further constrained to their own real display name
-- (no spoofing another name) and, on insert, to status='pending' (no
-- self-approval at creation). Status changes after that, and any edit to an
-- already-decided request's actual leave period/type, are additionally
-- locked down below by a trigger, since RLS's WITH CHECK can't express "this
-- column may not change" or "reset this other column as a side effect."
drop policy if exists "own or admin read" on leave_requests;
create policy "own or admin read" on leave_requests
  for select
  to authenticated
  using (profile_id = auth.uid() or is_admin());

drop policy if exists "own or admin insert" on leave_requests;
create policy "own or admin insert" on leave_requests
  for insert
  to authenticated
  with check (
    is_admin()
    or (
      profile_id = auth.uid()
      and status = 'pending'
      and employee_name = (select display_name from profiles where id = auth.uid())
    )
  );

-- employee_name isn't re-checked here against the caller's own display name
-- the way the insert policy does: WITH CHECK only sees the proposed NEW row,
-- not OLD, so it can't tell "unchanged" from "reassigned" — and a stale
-- employee_name left over from a profile rename (see the profile_id comment
-- above) must still be allowed to pass through untouched on an update to
-- some other column. The trigger below has both OLD and NEW, so the
-- spoofing check (only an actual *change* to employee_name is constrained)
-- lives there instead.
drop policy if exists "own or admin update" on leave_requests;
create policy "own or admin update" on leave_requests
  for update
  to authenticated
  using (profile_id = auth.uid() or is_admin())
  with check (profile_id = auth.uid() or is_admin());

-- No delete policy: the app only ever soft-deletes (sets deleted_at via
-- update), so with no policy for this operation RLS denies every real
-- DELETE by default — not even an admin's own session can hard-delete a row
-- via the API, bypassing the soft-delete/undo mechanism.
drop policy if exists "admin delete" on leave_requests;

-- Backstop for setLeaveRequestStatus's requireAdmin() check, and for cases
-- RLS's WITH CHECK can't express on its own (it only sees the proposed NEW
-- row, not OLD, so it can't tell an unchanged column from a changed one):
--  1. a non-admin's own valid session could otherwise call the REST API
--     directly and set their own request to 'approved' (the update policy
--     above only checks ownership, not which columns changed);
--  2. a non-admin changing employee_name to anything other than their own
--     current display name — an *unchanged* legacy value (stale after a
--     profile rename) still has to pass, only an actual reassignment is
--     blocked;
--  3. once a request is approved/denied, a non-admin changing what was
--     actually approved (its type or dates) sends it back to 'pending' for
--     re-review instead of silently keeping the old decision's status.
create or replace function enforce_status_admin_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin() then
    return new;
  end if;

  if new.status is distinct from old.status then
    raise exception 'only an admin can change a request''s status';
  end if;

  if new.employee_name is distinct from old.employee_name
    and new.employee_name is distinct from (
      select display_name from profiles where id = auth.uid()
    )
  then
    raise exception 'cannot reassign a request to another name';
  end if;

  if old.status <> 'pending' and (
    new.leave_type_id is distinct from old.leave_type_id
    or new.start_date is distinct from old.start_date
    or new.end_date is distinct from old.end_date
  ) then
    new.status := 'pending';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_status_admin_only on leave_requests;
create trigger trg_enforce_status_admin_only
  before update on leave_requests
  for each row
  execute function enforce_status_admin_only();
