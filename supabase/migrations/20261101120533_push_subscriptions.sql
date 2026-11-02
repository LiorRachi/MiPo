-- Web Push subscriptions, one row per browser/device a user has enabled
-- notifications on (see components/shared/NotificationToggle.tsx +
-- lib/push/subscribe.ts). Sending itself (lib/push/send.ts) always goes
-- through the service-role client — nothing client-side ever needs to list
-- these, so there's deliberately no select policy.
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

-- A user may register/replace or remove only their own subscription(s). The
-- update policy exists solely so subscribeToPush's upsert (on a re-enable
-- from the same browser, matching the unique endpoint) has an UPDATE path to
-- satisfy, same as every other RLS-governed upsert in this schema — nothing
-- calls a plain UPDATE on this table directly.
create policy "own insert" on push_subscriptions
  for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "own update" on push_subscriptions
  for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "own delete" on push_subscriptions
  for delete
  to authenticated
  using (profile_id = auth.uid());
