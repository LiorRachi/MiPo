-- Lets any authenticated user read any *approved* request, not just their
-- own or (as an admin) everyone's — the week-grid view now shows the whole
-- team's approved leave, matching its original "who's out" purpose. Pending
-- and denied requests stay visible only to their owner and admins.
drop policy "own or admin read" on leave_requests;

create policy "own or admin or approved read" on leave_requests
  for select
  to authenticated
  using (profile_id = auth.uid() or is_admin() or status = 'approved');
