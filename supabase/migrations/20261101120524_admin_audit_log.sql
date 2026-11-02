-- Audit trail for admin-only actions (user/leave-type management) — written
-- by lib/auth/auditLog.ts, called from app/settings/actions.ts. No UI reads
-- this yet; it only exists so the history is captured for when one is built.
create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  -- set null (not cascade-deleted) so the log entry survives the actor's
  -- own account later being removed — actor_name keeps it readable either way.
  actor_id uuid references profiles(id) on delete set null,
  actor_name text not null,
  action text not null,
  target_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_log_created_at_idx on admin_audit_log (created_at desc);

alter table admin_audit_log enable row level security;

-- No policies: every write goes through logAdminAction() using the
-- service-role client, behind requireAdmin() in the calling action. With no
-- policy here, RLS denies every row to the regular client by default — an
-- audit log a logged-in user could edit or erase via their own session
-- would defeat the point of having one.
