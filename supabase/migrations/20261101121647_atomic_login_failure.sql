-- The login_attempts increment was originally done app-side as a separate
-- select-then-upsert in app/login/actions.ts — a lost-update race: two
-- failed logins close together can both read the same failed_count and both
-- write count+1, silently losing an increment and letting the real number
-- of failures exceed what the lockout thinks it is. Moving the whole
-- increment-and-maybe-lock into one statement here makes it atomic:
-- concurrent calls serialize through the upsert's own conflict handling
-- instead of racing on a read in application code.
--
-- Threshold/duration are hardcoded here, not taken as parameters, since
-- this runs with elevated (security definer) privilege and a caller-supplied
-- threshold/duration would let whoever can invoke this RPC pick their own
-- lockout window. Keep these in sync with LOCKOUT_THRESHOLD/LOCKOUT_MINUTES
-- in app/login/actions.ts.
create function record_login_attempt_failure(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_failed_count int;
begin
  insert into login_attempts (email, failed_count, updated_at)
  values (p_email, 1, now())
  on conflict (email) do update
    set failed_count = login_attempts.failed_count + 1,
        updated_at = now()
  returning login_attempts.failed_count into v_failed_count;

  if v_failed_count >= 5 then
    update login_attempts
      set locked_until = now() + interval '15 minutes'
      where email = p_email;
  end if;
end;
$$;

-- Postgres grants EXECUTE on a new function to PUBLIC by default, which in
-- Supabase's role hierarchy reaches anon and authenticated too — i.e.
-- callable directly over the REST /rpc/ endpoint by anyone, for an arbitrary
-- email, with no auth check of its own. This is meant to be called only
-- from app/login/actions.ts's own service-role client, pre-session;
-- revoking the default grant closes off every other path to it.
revoke execute on function record_login_attempt_failure(text) from public, anon, authenticated;
