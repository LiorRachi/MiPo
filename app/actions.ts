"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getCurrentUser, requireAdmin, type CurrentUser } from "@/lib/auth/auth";
import { normalizeFieldValue } from "@/lib/utils/formUtils";
import { resolveEmployeeName } from "@/lib/leave/resolveEmployeeName";
import {
  createClient,
  requireSupabaseClient,
  supabaseConfigured,
  type SupabaseServerClient,
} from "@/lib/supabase/server";
import { hasOverlappingRequest, type LeaveRequestStatus } from "@/lib/leave/leave";
import { isRangeBoundaryHidden } from "@/lib/leave/leaveRules";
import { notifyAdminsOfNewRequest, notifyEmployeeOfDecision } from "@/lib/push/notify";
import { parseISODate } from "@/lib/utils/date";

export type AddRequestState = {
  error?: string;
  ok?: boolean;
};

function revalidateLeaveRequestConsumers() {
  revalidatePath("/");
  revalidatePath("/requests");
}

// 23P01 = exclusion_violation: the leave_requests_no_overlap DB constraint,
// the backstop for the race the hasOverlappingRequest pre-check can't fully
// close (two requests both passing the check before either commits). Maps
// to the same message the pre-check itself returns, instead of a raw
// Postgres error reaching the user.
function overlapErrorMessage(error: { code?: string; message: string }): string {
  return error.code === "23P01" ? "קיימת בקשה חופפת בתאריכים אלו" : error.message;
}

// Shared by every action below that just needs "a logged-in user, writing
// through a configured client" — addLeaveRequest is the only one that opts
// out, since its not-configured message points admins at the setup
// instructions shown on that same page.
async function requireSessionAndSupabase(): Promise<
  { error: string } | { supabase: SupabaseServerClient; currentUser: CurrentUser }
> {
  const clientResult = await requireSupabaseClient();
  if ("error" in clientResult) return clientResult;

  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "יש להתחבר מחדש." };

  return { supabase: clientResult.supabase, currentUser };
}

function parseRequestFields(
  formData: FormData,
):
  | { error: string }
  | {
    leaveTypeId: string;
    date: string;
    endDate: string;
    reason: string | null;
  } {
  const leaveTypeId = normalizeFieldValue(formData, "leave_type_id");
  const date = normalizeFieldValue(formData, "date");
  const endDateRaw = normalizeFieldValue(formData, "end_date");
  const reason = normalizeFieldValue(formData, "reason");

  const isoDate = /^\d{4}-\d{2}-\d{2}$/;

  if (!leaveTypeId) return { error: "נא לבחור סוג בקשת יציאה" };
  if (!date) return { error: "נא לבחור תאריך" };
  if (!isoDate.test(date)) return { error: "פורמט תאריך לא תקין" };

  const endDate = endDateRaw || date;
  if (!isoDate.test(endDate)) return { error: "פורמט תאריך לא תקין" };
  if (endDate < date) return { error: "תאריך הסיום לא יכול להיות לפני תאריך ההתחלה" };

  return { leaveTypeId, date, endDate, reason: reason || null };
}

// Mirrors the client-side guard in RequestSheet/RequestFormFields (which
// just steers the UI) — without this, a direct POST could still create a
// request for a leave type that's entirely hidden across the submitted range.
async function validateTypeDateCombo(
  supabase: SupabaseServerClient,
  leaveTypeId: string,
  date: string,
  endDate: string,
): Promise<{ error: string } | null> {
  const { data: leaveType } = await supabase
    .from("leave_types")
    .select("label_he, weekend_applicable, color_key, sort_order, full_day")
    .eq("id", leaveTypeId)
    .maybeSingle();
  if (!leaveType) return { error: "סוג בקשת יציאה לא נמצא" };

  const parsedDate = parseISODate(date);
  const parsedEndDate = parseISODate(endDate);
  if (
    parsedDate &&
    parsedEndDate &&
    isRangeBoundaryHidden({ ...leaveType, id: leaveTypeId }, parsedDate, parsedEndDate)
  ) {
    return {
      error: `${leaveType.label_he} לא חל/ה בסופ״ש - בחרו סוג יציאה אחר או תאריך אחר.`,
    };
  }
  return null;
}

export async function addLeaveRequest(
  _prevState: AddRequestState,
  formData: FormData,
): Promise<AddRequestState> {
  const supabase = await createClient();
  if (!supabaseConfigured || !supabase) {
    return { error: "Supabase לא מחובר עדיין — ראה הוראות ההגדרה בעמוד." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "יש להתחבר מחדש." };

  const parsed = parseRequestFields(formData);
  if ("error" in parsed) return parsed;

  const conflict = await validateTypeDateCombo(
    supabase,
    parsed.leaveTypeId,
    parsed.date,
    parsed.endDate,
  );
  if (conflict) return conflict;

  const nameResult = await resolveEmployeeName(formData, currentUser);
  if ("error" in nameResult) return nameResult;

  if (
    nameResult.profileId &&
    (await hasOverlappingRequest(supabase, nameResult.profileId, parsed.date, parsed.endDate))
  ) {
    return { error: "קיימת בקשה חופפת בתאריכים אלו" };
  }

  const { error } = await supabase.from("leave_requests").insert({
    employee_name: nameResult.employeeName,
    profile_id: nameResult.profileId,
    leave_type_id: parsed.leaveTypeId,
    start_date: parsed.date,
    end_date: parsed.endDate,
    reason: parsed.reason,
  });

  if (error) return { error: overlapErrorMessage(error) };

  revalidateLeaveRequestConsumers();
  after(() => notifyAdminsOfNewRequest(nameResult.employeeName));
  return { ok: true };
}

export async function updateLeaveRequest(
  _prevState: AddRequestState,
  formData: FormData,
): Promise<AddRequestState> {
  const session = await requireSessionAndSupabase();
  if ("error" in session) return session;
  const { supabase, currentUser } = session;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "שגיאה — חסר מזהה" };

  const parsed = parseRequestFields(formData);
  if ("error" in parsed) return parsed;

  const conflict = await validateTypeDateCombo(
    supabase,
    parsed.leaveTypeId,
    parsed.date,
    parsed.endDate,
  );
  if (conflict) return conflict;

  const updatePayload: {
    employee_name?: string;
    profile_id?: string | null;
    leave_type_id: string;
    start_date: string;
    end_date: string;
    reason: string | null;
  } = {
    leave_type_id: parsed.leaveTypeId,
    start_date: parsed.date,
    end_date: parsed.endDate,
    reason: parsed.reason,
  };

  // The profile this edit's overlap check (below) runs against: a non-admin
  // can only ever be editing their own request (enforced by the .eq below),
  // so it's always their own id; an admin may be reassigning it, in which
  // case the *new* assignee is who must not be double-booked.
  let profileIdForOverlap: string | null = currentUser.id;

  // Only an admin may reassign whose request this is; a non-admin editing a
  // request (even one of someone else's, opened from the day list) leaves
  // employee_name/profile_id untouched rather than silently reattributing it
  // to them.
  if (currentUser.role === "admin") {
    // The "keep a legacy name unchanged" allowance must check the row's
    // *actual* current name, not a client-supplied hidden field — otherwise
    // an admin could submit any arbitrary string alongside a matching
    // tampered hidden field and bypass the profiles check entirely.
    const { data: existing } = await supabase
      .from("leave_requests")
      .select("employee_name")
      .eq("id", id)
      .maybeSingle();

    const nameResult = await resolveEmployeeName(
      formData,
      currentUser,
      existing?.employee_name,
    );
    if ("error" in nameResult) return nameResult;
    updatePayload.employee_name = nameResult.employeeName;
    updatePayload.profile_id = nameResult.profileId;
    profileIdForOverlap = nameResult.profileId;
  }

  if (
    profileIdForOverlap &&
    (await hasOverlappingRequest(supabase, profileIdForOverlap, parsed.date, parsed.endDate, id))
  ) {
    return { error: "קיימת בקשה חופפת בתאריכים אלו" };
  }

  let updateQuery = supabase
    .from("leave_requests")
    .update(updatePayload)
    .eq("id", id)
    .is("deleted_at", null);
  // A non-admin only sees their own requests app-wide, so editing is scoped
  // the same way server-side — otherwise a guessed/leaked id would still let
  // them edit someone else's request directly. Keyed by the stable profile
  // id rather than employee_name, which can collide or be renamed out from
  // under them.
  if (currentUser.role !== "admin") {
    updateQuery = updateQuery.eq("profile_id", currentUser.id);
  }
  const { data, error } = await updateQuery.select("id");

  if (error) return { error: overlapErrorMessage(error) };
  if (!data || data.length === 0) {
    return { error: "הבקשה נמחקה ולא ניתן יותר לערוך אותה" };
  }

  revalidateLeaveRequestConsumers();
  return { ok: true };
}

// Soft delete: sets deleted_at instead of removing the row, so a delete can
// be undone (see undoDeleteLeaveRequest) via a short toast after the fact.
export async function deleteLeaveRequest(id: string): Promise<{ error?: string }> {
  const session = await requireSessionAndSupabase();
  if ("error" in session) return session;
  const { supabase, currentUser } = session;

  let query = supabase
    .from("leave_requests")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (currentUser.role !== "admin") {
    query = query.eq("profile_id", currentUser.id);
  }
  const { data, error } = await query.select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "הבקשה לא נמצאה" };
  }

  revalidateLeaveRequestConsumers();
  return {};
}

export async function undoDeleteLeaveRequest(
  id: string,
): Promise<{ error?: string }> {
  const session = await requireSessionAndSupabase();
  if ("error" in session) return session;
  const { supabase, currentUser } = session;

  let query = supabase
    .from("leave_requests")
    .update({ deleted_at: null })
    .eq("id", id);
  if (currentUser.role !== "admin") {
    query = query.eq("profile_id", currentUser.id);
  }
  const { data, error } = await query.select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "הבקשה לא נמצאה" };
  }

  revalidateLeaveRequestConsumers();
  return {};
}

// Admin-only: approve/deny only makes sense as a manager action, and since
// non-admins now only ever see their own requests app-wide, letting them
// also change status would just be self-approval.
export async function setLeaveRequestStatus(
  id: string,
  status: LeaveRequestStatus,
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const clientResult = await requireSupabaseClient();
  if ("error" in clientResult) return clientResult;
  const { supabase } = clientResult;

  // The audit trail (who decided, and when) only applies while the request
  // is actually decided — reverting to "pending" (the undo case in
  // RequestRow) clears it rather than leaving a stale decider on a request
  // that's open again.
  const decided = status !== "pending";
  const { data, error } = await supabase
    .from("leave_requests")
    .update({
      status,
      decided_by: decided ? auth.user.id : null,
      decided_by_name: decided ? auth.user.displayName : null,
      decided_at: decided ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id, profile_id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "הבקשה נמחקה ולא ניתן יותר לעדכן את הסטטוס שלה" };
  }

  revalidateLeaveRequestConsumers();
  after(() => notifyEmployeeOfDecision(data[0].profile_id, status));
  return {};
}
