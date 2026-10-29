"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { fetchAllUsers } from "@/lib/users";
import type { LeaveRequestStatus } from "@/lib/leave";

export type AddRequestState = {
  error?: string;
  ok?: boolean;
};

function revalidateLeaveRequestConsumers() {
  revalidatePath("/");
  revalidatePath("/requests");
}

function normailzeFieldValue(formData: FormData, fieldKey: string): string {
  return String(formData.get(fieldKey) ?? "").trim();
}

function parseRequestFields(
  formData: FormData,
):
  | { error: string }
  | {
    leaveTypeId: string;
    date: string;
    reason: string | null;
  } {
  const leaveTypeId = normailzeFieldValue(formData, "leave_type_id");
  const date = normailzeFieldValue(formData, "date");
  const reason = normailzeFieldValue(formData, "reason");

  const isoDate = /^\d{4}-\d{2}-\d{2}$/;

  if (!leaveTypeId) return { error: "נא לבחור סוג חופשה" };
  if (!date) return { error: "נא לבחור תאריך" };
  if (!isoDate.test(date)) return { error: "פורמט תאריך לא תקין" };

  return { leaveTypeId, date, reason: reason || null };
}

// The employee_name a non-admin submits is never trusted (a disabled/hidden
// client field is still spoofable) — for them it's always their own
// name/id, taken from the session. Only an admin may pick a different name,
// resolved against the real profiles list rather than taken as free text.
// A profile match always wins, even when the submitted name is unchanged
// from the row's current one — otherwise every edit that leaves the name
// dropdown untouched (the common case) would be mistaken for "preserving a
// legacy name" and silently drop a perfectly valid profile_id.
// `allowedExtraName` only kicks in once no profile matches: it lets an edit
// keep a request's existing name even when it isn't a registered profile
// (e.g. free-text names entered before this feature existed) — the select
// still offers it as an option (see RequestFormFields) precisely so it
// round-trips unchanged rather than silently reassigning the request to
// whichever name happened to be first. Callers must pass the row's *actual
// current* employee_name (read from the DB), not a client-supplied value —
// otherwise a tampered hidden field would let an admin bypass the profiles
// check entirely for an arbitrary string.
async function resolveEmployeeName(
  formData: FormData,
  isAdmin: boolean,
  selfId: string,
  selfDisplayName: string,
  allowedExtraName?: string,
): Promise<{ error: string } | { employeeName: string; profileId: string | null }> {
  if (!isAdmin) return { employeeName: selfDisplayName, profileId: selfId };

  const submitted = normailzeFieldValue(formData, "employee_name");
  if (!submitted) return { error: "נא לבחור שם חייל/ת" };

  const profiles = await fetchAllUsers().catch(() => null);
  if (!profiles) return { error: "שגיאה בטעינת רשימת המשתמשים, נסו שוב." };

  const match = profiles.find((p) => p.display_name === submitted);
  if (match) return { employeeName: submitted, profileId: match.id };

  if (submitted === allowedExtraName) {
    // No profile matches, but it's the row's own current name — preserve it
    // unchanged rather than reject the edit.
    return { employeeName: submitted, profileId: null };
  }

  return { error: "שם לא תקין" };
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

  const nameResult = await resolveEmployeeName(
    formData,
    currentUser.role === "admin",
    currentUser.id,
    currentUser.displayName,
  );
  if ("error" in nameResult) return nameResult;

  const { error } = await supabase.from("leave_requests").insert({
    employee_name: nameResult.employeeName,
    profile_id: nameResult.profileId,
    leave_type_id: parsed.leaveTypeId,
    start_date: parsed.date,
    end_date: parsed.date,
    reason: parsed.reason,
  });

  if (error) return { error: error.message };

  revalidateLeaveRequestConsumers();
  return { ok: true };
}

export async function updateLeaveRequest(
  _prevState: AddRequestState,
  formData: FormData,
): Promise<AddRequestState> {
  const supabase = await createClient();
  if (!supabaseConfigured || !supabase) {
    return { error: "Supabase לא מחובר עדיין." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "שגיאה — חסר מזהה" };

  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "יש להתחבר מחדש." };

  const parsed = parseRequestFields(formData);
  if ("error" in parsed) return parsed;

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
    end_date: parsed.date,
    reason: parsed.reason,
  };

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
      true,
      currentUser.id,
      currentUser.displayName,
      existing?.employee_name,
    );
    if ("error" in nameResult) return nameResult;
    updatePayload.employee_name = nameResult.employeeName;
    updatePayload.profile_id = nameResult.profileId;
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

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "הבקשה נמחקה ולא ניתן יותר לערוך אותה" };
  }

  revalidateLeaveRequestConsumers();
  return { ok: true };
}

// Soft delete: sets deleted_at instead of removing the row, so a delete can
// be undone (see undoDeleteLeaveRequest) via a short toast after the fact.
export async function deleteLeaveRequest(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  if (!supabaseConfigured || !supabase) {
    return { error: "Supabase לא מחובר עדיין." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "יש להתחבר מחדש." };

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
  const supabase = await createClient();
  if (!supabaseConfigured || !supabase) {
    return { error: "Supabase לא מחובר עדיין." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "יש להתחבר מחדש." };

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

  const supabase = await createClient();
  if (!supabaseConfigured || !supabase) {
    return { error: "Supabase לא מחובר עדיין." };
  }

  const { data, error } = await supabase
    .from("leave_requests")
    .update({ status })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "הבקשה נמחקה ולא ניתן יותר לעדכן את הסטטוס שלה" };
  }

  revalidateLeaveRequestConsumers();
  return {};
}
