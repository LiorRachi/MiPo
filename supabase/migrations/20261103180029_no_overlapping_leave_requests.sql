-- DB-layer backstop for hasOverlappingRequest() in lib/leave/leave.ts: that
-- check-then-insert in app/actions.ts has a race window between two
-- concurrent requests for the same employee. Mirrors its exact overlap
-- semantics (same profile, inclusive date range, excludes denied/deleted).
create extension if not exists btree_gist;

alter table leave_requests
  add constraint leave_requests_no_overlap
  exclude using gist (
    profile_id with =,
    daterange(start_date, end_date, '[]') with &&
  )
  where (profile_id is not null and status <> 'denied' and deleted_at is null);
