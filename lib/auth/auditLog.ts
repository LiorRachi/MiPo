import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CurrentUser } from "./auth";

/** Records an admin-only action (user/leave-type management) for later
 * review — there's no UI that reads this yet, so this just captures the
 * history so it exists when one is built. Uses the service-role client
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
