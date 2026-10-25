"use server";

import { revalidatePath } from "next/cache";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export type AddRequestState = {
  error?: string;
  ok?: boolean;
};

export async function addLeaveRequest(
  _prevState: AddRequestState,
  formData: FormData,
): Promise<AddRequestState> {
  if (!supabaseConfigured || !supabase) {
    return { error: "Supabase לא מחובר עדיין — ראה הוראות ההגדרה בעמוד." };
  }

  const employeeName = String(formData.get("employee_name") ?? "").trim();
  const leaveTypeId = String(formData.get("leave_type_id") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDate = String(formData.get("end_date") ?? "").trim();

  const isoDate = /^\d{4}-\d{2}-\d{2}$/;

  if (!employeeName) return { error: "נא להזין שם עובד/ת" };
  if (!leaveTypeId) return { error: "נא לבחור סוג חופשה" };
  if (!startDate || !endDate) return { error: "נא לבחור תאריכים" };
  if (!isoDate.test(startDate) || !isoDate.test(endDate)) {
    return { error: "פורמט תאריך לא תקין" };
  }
  if (endDate < startDate) return { error: "תאריך הסיום לפני תאריך ההתחלה" };

  const { error } = await supabase.from("leave_requests").insert({
    employee_name: employeeName,
    leave_type_id: leaveTypeId,
    start_date: startDate,
    end_date: endDate,
  });

  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true };
}
