import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CurrentUser } from "./auth";

export type AuditLogEntry = {
  id: string;
  actor_name: string;
  action: string;
  target_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
};

export type AuditActionCategory = "create" | "update" | "delete";
export type AuditResourceType = "leave_type" | "user";

// Every logAdminAction call below uses a "<resource>.<category>" action
// string (leave_type.create, user.delete, ...) — derived here from that one
// string instead of a second lookup table, so the audit-log UI's filters and
// icons can't drift out of sync with the actions actually being logged.
export function auditActionCategory(action: string): AuditActionCategory {
  if (action.endsWith(".delete")) return "delete";
  if (action.endsWith(".create")) return "create";
  return "update";
}

export function auditResourceType(action: string): AuditResourceType {
  return action.startsWith("user.") ? "user" : "leave_type";
}

/** Records an admin-only action (user/leave-type management) for later
 * review — captured by every admin action in app/settings/actions.ts, read
 * by the /settings/audit-log page. Uses the service-role client
 * (admin_audit_log has no RLS policy for the regular client); every caller
 * must already have passed its own requireAdmin() check. Never throws — a
 * logging failure must not fail the admin action it's recording. */
export async function logAdminAction(
  actor: CurrentUser,
  action: string,
  options: { targetId?: string; detail?: Record<string, unknown> } = {},
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("admin_audit_log").insert({
    actor_id: actor.id,
    actor_name: actor.displayName,
    action,
    target_id: options.targetId ?? null,
    detail: options.detail ?? null,
  });
}

/** Admin-only: the most recent audit log entries, for the Settings → audit
 * log screen. Uses the service-role client since admin_audit_log has no RLS
 * policy for the regular client (see the migration). Still checks admin
 * status itself rather than relying solely on caller discipline, the same
 * guard fetchAllUsers uses for the same reason. */
export async function fetchAuditLog(
  currentUser: CurrentUser,
  limit = 100,
): Promise<AuditLogEntry[]> {
  if (currentUser.role !== "admin") return [];

  const admin = createAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("admin_audit_log")
    .select("id, actor_name, action, target_id, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}
