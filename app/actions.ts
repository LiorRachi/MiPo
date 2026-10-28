"use server";

import { revalidatePath } from "next/cache";
import { supabase, supabaseConfigured } from "@/lib/supabase";
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
    employeeName: string;
    leaveTypeId: string;
    date: string;
    reason: string | null;
  } {
  const employeeName = normailzeFieldValue(formData, "employee_name");
  const leaveTypeId = normailzeFieldValue(formData, "leave_type_id");
  const date = normailzeFieldValue(formData, "date");
  const reason = normailzeFieldValue(formData, "reason");

  const isoDate = /^\d{4}-\d{2}-\d{2}$/;

  if (!employeeName) return { error: "נא להזין שם חייל/ת" };
  if (!leaveTypeId) return { error: "נא לבחור סוג חופשה" };
  if (!date) return { error: "נא לבחור תאריך" };
  if (!isoDate.test(date)) return { error: "פורמט תאריך לא תקין" };

  return { employeeName, leaveTypeId, date, reason: reason || null };
}

export async function addLeaveRequest(
  _prevState: AddRequestState,
  formData: FormData,
): Promise<AddRequestState> {
  if (!supabaseConfigured || !supabase) {
    return { error: "Supabase לא מחובר עדיין — ראה הוראות ההגדרה בעמוד." };
  }

  const parsed = parseRequestFields(formData);
  if ("error" in parsed) return parsed;

  const { error } = await supabase.from("leave_requests").insert({
    employee_name: parsed.employeeName,
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
  if (!supabaseConfigured || !supabase) {
    return { error: "Supabase לא מחובר עדיין." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "שגיאה — חסר מזהה" };

  const parsed = parseRequestFields(formData);
  if ("error" in parsed) return parsed;

  const { data, error } = await supabase
    .from("leave_requests")
    .update({
      employee_name: parsed.employeeName,
      leave_type_id: parsed.leaveTypeId,
      start_date: parsed.date,
      end_date: parsed.date,
      reason: parsed.reason,
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id");

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
  if (!supabaseConfigured || !supabase) {
    return { error: "Supabase לא מחובר עדיין." };
  }

  const { error } = await supabase
    .from("leave_requests")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateLeaveRequestConsumers();
  return {};
}

export async function undoDeleteLeaveRequest(
  id: string,
): Promise<{ error?: string }> {
  if (!supabaseConfigured || !supabase) {
    return { error: "Supabase לא מחובר עדיין." };
  }

  const { error } = await supabase
    .from("leave_requests")
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateLeaveRequestConsumers();
  return {};
}

export async function setLeaveRequestStatus(
  id: string,
  status: LeaveRequestStatus,
): Promise<{ error?: string }> {
  // v1: single "admin" user, no permission check yet — every reader of this
  // app can read/write everything. Gate this by role once real per-user
  // permissions exist.
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
