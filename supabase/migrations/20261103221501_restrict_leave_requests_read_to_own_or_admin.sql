-- Reverts 20261101114346_loosen_approved_read.sql: the week grid ("/") that
-- justified letting any authenticated user read any approved request is now
-- admin-only (see app/page.tsx), so a non-admin reading it was never this
-- app's intent — it's just the one window this policy left open. Back to
-- the original rule: a non-admin can only ever read their own requests.
drop policy "own or admin or approved read" on leave_requests;

create policy "own or admin read" on leave_requests
  for select
  to authenticated
  using (profile_id = auth.uid() or is_admin());
