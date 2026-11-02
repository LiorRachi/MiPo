-- A push endpoint is tied to a physical browser/device, not an app account
-- (the same browser reuses the same endpoint regardless of which app user
-- is logged in). subscribeToPush's upsert hits "own update" when a device
-- already has a row owned by a *different* profile_id (e.g. a shared
-- computer, or an account switch on the same browser) — the old USING
-- clause required already owning that row, which can never be true for the
-- new owner, so the upsert was rejected with an RLS violation instead of
-- reassigning the subscription. The security property that actually matters
-- is kept: you may only ever point a subscription AT yourself (still
-- enforced by WITH CHECK) — not that you must already own whatever row is
-- sitting at that endpoint.
drop policy "own update" on push_subscriptions;

create policy "own update" on push_subscriptions
  for update
  to authenticated
  using (true)
  with check (profile_id = auth.uid());
