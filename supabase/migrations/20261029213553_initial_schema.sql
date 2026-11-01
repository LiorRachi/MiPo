-- MiPo core schema — see sketch-findings-mipo skill for the design decisions
-- this implements.

create table leave_types (
  id uuid primary key default gen_random_uuid(),
  label_he text not null,
  color_key text not null, -- must match a --leave-<color_key> token in app/globals.css
  sort_order int not null default 0,
  -- Whether a request of this type should still show on the Friday/Saturday
  -- columns of the week-grid (e.g. reserve duty applies every day; office-only
  -- errands don't).
  weekend_applicable boolean not null default true,
  created_at timestamptz not null default now(),
  -- Enforced at the DB layer (not just a comment): adding a leave type with a
  -- color_key that has no matching CSS token would otherwise render a chip
  -- with no visible color and no error anywhere. Add the new key to
  -- app/globals.css (and this list) together, in the same migration.
  constraint leave_types_color_key_check
    check (color_key in ('vacation', 'medical', 'other', 'green', 'teal', 'rose'))
);

-- Login accounts (admin-created only — see README, there is no public
-- signup). One row per auth.users row, holding the display name and
-- admin/employee role the app needs beyond what Supabase Auth itself stores.
-- Deleting the auth user (via the admin API) cascades here automatically.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null default 'employee',
  created_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('admin', 'employee')),
  -- Two profiles sharing a display name make every name-keyed lookup
  -- ambiguous (attendance-list status, admin request reassignment) —
  -- enforced here so that ambiguity can't exist in the first place, rather
  -- than every reader of employee_name having to guard against it.
  constraint profiles_display_name_unique unique (display_name)
);

create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  -- Denormalized display label — many screens read it directly. Free text:
  -- two people can share a display name, and it stays correct across a
  -- profile rename via the sync trigger below, not a live join.
  employee_name text not null,
  leave_type_id uuid not null references leave_types(id) on delete restrict,
  -- The stable identity a request's ownership/visibility checks key off of.
  -- Nullable: a legacy free-text name with no matching profile still works
  -- (visible to admins) but isn't owned by anyone in particular.
  profile_id uuid references profiles(id) on delete set null,
  start_date date not null,
  end_date date not null,
  reason text,
  -- Changing status is admin-only (enforced in app/actions.ts via
  -- requireAdmin(), and backstopped below by enforce_status_admin_only()
  -- since RLS alone can't gate a single column).
  status text not null default 'pending',
  -- Audit trail: who decided this request (approved/denied) and when. Set by
  -- setLeaveRequestStatus in app/actions.ts, and cleared back to null
  -- whenever status returns to 'pending'. decided_by_name denormalizes
  -- profiles.display_name the same way employee_name does, kept in sync by
  -- the same trigger.
  decided_by uuid references profiles(id) on delete set null,
  decided_by_name text,
  decided_at timestamptz,
  -- Soft delete: deleting a request sets this instead of removing the row,
  -- so a delete can be undone with a short "בטל" toast. Rows with a
  -- non-null deleted_at are excluded from every fetch.
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint end_after_start check (end_date >= start_date),
  constraint leave_requests_status_check check (status in ('pending', 'approved', 'denied'))
);

create index leave_requests_date_range_idx on leave_requests (start_date, end_date);
create index leave_requests_profile_id_idx on leave_requests (profile_id);

-- security definer + fixed search_path: lets RLS policies below check the
-- caller's role without each policy repeating the profiles subquery, and
-- without being redefinable by a search_path trick from a non-superuser role.
create function is_admin()
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

-- Backstop for setLeaveRequestStatus's requireAdmin() check, and for cases
-- RLS's WITH CHECK can't express on its own (it only sees the proposed NEW
-- row, not OLD, so it can't tell an unchanged column from a changed one):
--  1. a non-admin's own valid session could otherwise call the REST API
--     directly and set their own request to 'approved' (the update policy
--     below only checks ownership, not which columns changed);
--  2. a non-admin changing employee_name to anything other than their own
--     current display name — an *unchanged* legacy value (stale after a
--     profile rename) still has to pass, only an actual reassignment is
--     blocked;
--  3. once a request is approved/denied, a non-admin changing what was
--     actually approved (its type or dates) sends it back to 'pending' for
--     re-review instead of silently keeping the old decision's status.
create function enforce_status_admin_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- A null auth.uid() means this update has no authenticated end-user
  -- session at all — only the service-role client (gated by requireAdmin()
  -- in app code, e.g. the display-name sync trigger below running off an
  -- admin's profile update) or a direct SQL Editor connection reach this
  -- trigger that way. Every genuine end-user request reaching this table
  -- goes through RLS's "to authenticated" policies, which guarantee a real
  -- auth.uid(); this bypass only ever applies to the already-trusted paths.
  if auth.uid() is null or is_admin() then
    return new;
  end if;

  if new.status is distinct from old.status then
    raise exception 'only an admin can change a request''s status';
  end if;

  -- The audit trail is as much a decision as status itself — a non-admin's
  -- own valid session could otherwise leave status untouched but forge who
  -- supposedly decided it (or when), via the REST API directly.
  if new.decided_by is distinct from old.decided_by
    or new.decided_by_name is distinct from old.decided_by_name
    or new.decided_at is distinct from old.decided_at
  then
    raise exception 'only an admin can change a request''s decision record';
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
    -- The prior decision no longer applies to what's actually being
    -- requested now, so its audit trail goes back to null along with it.
    new.status := 'pending';
    new.decided_by := null;
    new.decided_by_name := null;
    new.decided_at := null;
  end if;

  return new;
end;
$$;

create trigger trg_enforce_status_admin_only
  before update on leave_requests
  for each row
  execute function enforce_status_admin_only();

-- Keeps the denormalized name columns (employee_name, decided_by_name) in
-- sync when an admin renames a profile in Settings — without this, every
-- past request from or decided by that person would keep showing their old
-- name forever, since those columns are plain text, not a live join.
create function sync_display_name_to_requests()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.display_name is distinct from old.display_name then
    update leave_requests set employee_name = new.display_name
      where profile_id = new.id;
    update leave_requests set decided_by_name = new.display_name
      where decided_by = new.id;
  end if;
  return new;
end;
$$;

create trigger trg_sync_display_name_to_requests
  after update on profiles
  for each row
  execute function sync_display_name_to_requests();

-- RLS. The app layer (app/actions.ts, lib/leave/leave.ts) already enforces
-- who can read or write what, but that only holds for requests that go
-- through our own Server Actions — a logged-in user's own Supabase session
-- can call the REST/JS API directly with their own valid token, bypassing
-- every app-layer check. These policies are the real enforcement; the
-- app-layer checks are just where the user-facing error messages and UX live.

alter table profiles enable row level security;
alter table leave_types enable row level security;
alter table leave_requests enable row level security;

-- The only client-side (RLS-governed) access profiles needs: a logged-in
-- user reading their own role, to decide whether to show them Settings (see
-- lib/auth/auth.ts). Listing every account and all writes go through the
-- service-role client from Settings' server actions instead (see
-- lib/supabase/admin.ts) — gated by that same role check, not by RLS — so no
-- broader policy exists here on purpose.
create policy "users can read own profile" on profiles
  for select
  to authenticated
  using (id = auth.uid());

-- Everyone needs to read leave types (the week-grid's legend/rows), but only
-- an admin manages the list itself (Settings → leave types).
create policy "read all leave types" on leave_types
  for select
  to authenticated
  using (true);

create policy "admin write leave types" on leave_types
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- A non-admin may only see/insert/update their own requests (by profile_id,
-- not the spoofable employee_name text); an admin sees and manages everyone's.
-- A non-admin's write is further constrained to their own real display name
-- (no spoofing another name) and, on insert, to status='pending' (no
-- self-approval at creation). Status changes after that, and any edit to an
-- already-decided request's actual leave period/type, are additionally
-- locked down by the trigger above, since RLS's WITH CHECK can't express
-- "this column may not change" or "reset this other column as a side effect."
create policy "own or admin read" on leave_requests
  for select
  to authenticated
  using (profile_id = auth.uid() or is_admin());

create policy "own or admin insert" on leave_requests
  for insert
  to authenticated
  with check (
    is_admin()
    or (
      profile_id = auth.uid()
      and status = 'pending'
      and employee_name = (select display_name from profiles where id = auth.uid())
      -- A fresh request has no decision yet — without this, a non-admin
      -- could otherwise insert one with a fabricated decided_by_name/
      -- decided_at straight through the REST API (the UPDATE-side trigger
      -- only guards changes to an existing row, not an insert's initial
      -- values).
      and decided_by is null
      and decided_by_name is null
      and decided_at is null
    )
  );

-- employee_name isn't re-checked here against the caller's own display name
-- the way the insert policy does: WITH CHECK only sees the proposed NEW row,
-- not OLD, so it can't tell "unchanged" from "reassigned" — and a stale
-- employee_name left over from a profile rename must still be allowed to
-- pass through untouched on an update to some other column. The trigger
-- above has both OLD and NEW, so the spoofing check (only an actual
-- *change* to employee_name is constrained) lives there instead.
create policy "own or admin update" on leave_requests
  for update
  to authenticated
  using (profile_id = auth.uid() or is_admin())
  with check (profile_id = auth.uid() or is_admin());

-- No delete policy: the app only ever soft-deletes (sets deleted_at via
-- update), so with no policy for this operation RLS denies every real
-- DELETE by default — not even an admin's own session (via the regular
-- client) can hard-delete a row via the API, bypassing the soft-delete/undo
-- mechanism. app/settings/actions.ts purges trashed rows via the
-- service-role admin client instead, which bypasses RLS entirely.
