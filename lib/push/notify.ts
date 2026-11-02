import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LeaveRequestStatus } from "@/lib/leave/leave";
import { sendPush } from "./send";

/** Pushes every admin that a new leave request needs review. Never throws —
 * a failed or unconfigured push must not fail the request submission that
 * triggered it (see app/actions.ts's addLeaveRequest). */
export async function notifyAdminsOfNewRequest(employeeName: string): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin) return;
    const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
    if (!admins || admins.length === 0) return;
    await sendPush(
      admins.map((a) => a.id),
      {
        title: "בקשת יציאה חדשה",
        body: `${employeeName} הגיש/ה בקשה חדשה הממתינה לאישור`,
        url: "/requests",
      },
    );
  } catch {
    // Best-effort — see function comment.
  }
}

/** Pushes the employee whose request was just decided. A no-op for
 * "pending" (reverting a decision back) and for a legacy request with no
 * linked profile_id. Never throws, for the same reason as above. */
export async function notifyEmployeeOfDecision(
  profileId: string | null,
  status: LeaveRequestStatus,
): Promise<void> {
  if (!profileId || status === "pending") return;
  try {
    const title = status === "approved" ? "הבקשה שלך אושרה" : "הבקשה שלך נדחתה";
    await sendPush([profileId], {
      title,
      body: "גשו לאפליקציה לפרטים",
      url: "/requests",
    });
  } catch {
    // Best-effort — see function comment.
  }
}
