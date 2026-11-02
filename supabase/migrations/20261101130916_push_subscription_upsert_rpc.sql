-- Root cause of the "new row violates row-level security policy" error on
-- every subscribeToPush call, even against an empty table: Postgres requires
-- SELECT access on the target table to plan/execute an
-- INSERT ... ON CONFLICT (endpoint) DO UPDATE — it has to be able to check
-- whether a conflicting row would be visible, regardless of whether a
-- conflict actually exists at runtime. This table deliberately has no SELECT
-- policy (see the previous migration's comment), so that requirement can
-- never be satisfied and the upsert fails unconditionally.
--
-- A SELECT policy scoped to "own rows" would fix the common case (same user
-- re-subscribing), but a push endpoint belongs to a physical browser/device,
-- not an account — the same browser can get reused by a different app user
-- (e.g. a shared computer), and a foreign owner's conflicting row would
-- stay invisible under an "own rows" SELECT policy, so the upsert would
-- fall through to a plain INSERT and hit a real unique-constraint violation
-- on `endpoint` instead of cleanly reassigning it.
--
-- Same shape of problem as record_login_attempt_failure (migration
-- 20261101121647): move the whole upsert into a security definer function
-- that runs as the table owner (RLS doesn't apply to it) and takes the
-- owner from auth.uid() itself rather than a caller-supplied id, so a
-- caller can only ever claim a subscription for themselves.
drop policy "own insert" on push_subscriptions;
drop policy "own update" on push_subscriptions;

create function upsert_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'upsert_push_subscription requires an authenticated caller';
  end if;

  insert into push_subscriptions (profile_id, endpoint, p256dh, auth)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update
    set profile_id = excluded.profile_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth;
end;
$$;

revoke execute on function upsert_push_subscription(text, text, text) from public, anon;
grant execute on function upsert_push_subscription(text, text, text) to authenticated;
