"use server";

import { revalidatePath } from "next/cache";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { isValidColorKey } from "@/lib/leaveTypeColors";

export type LeaveTypeActionState = {
  error?: string;
  ok?: boolean;
};

function revalidateLeaveTypeConsumers() {
  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/requests");
}

export async function addLeaveType(
  _prevState: LeaveTypeActionState,
  formData: FormData,
): Promise<LeaveTypeActionState> {
  if (!supabaseConfigured || !supabase) {
    return { error: "Supabase לא מחובר עדיין." };
  }

  const labelHe = String(formData.get("label_he") ?? "").trim();
  const colorKey = String(formData.get("color_key") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const weekendApplicable = formData.get("weekend_applicable") === "on";

  if (!labelHe) return { error: "נא להזין שם לסוג החופשה" };
  if (!isValidColorKey(colorKey)) return { error: "נא לבחור צבע" };

  const { error } = await supabase.from("leave_types").insert({
    label_he: labelHe,
    color_key: colorKey,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    weekend_applicable: weekendApplicable,
  });

  if (error) return { error: error.message };

  revalidateLeaveTypeConsumers();
  return { ok: true };
}

export async function updateLeaveType(
  _prevState: LeaveTypeActionState,
  formData: FormData,
): Promise<LeaveTypeActionState> {
  if (!supabaseConfigured || !supabase) {
    return { error: "Supabase לא מחובר עדיין." };
  }

  const id = String(formData.get("id") ?? "").trim();
  const labelHe = String(formData.get("label_he") ?? "").trim();
  const colorKey = String(formData.get("color_key") ?? "").trim();
  const weekendApplicable = formData.get("weekend_applicable") === "on";

  if (!id) return { error: "שגיאה — חסר מזהה" };
  if (!labelHe) return { error: "נא להזין שם לסוג החופשה" };
  if (!isValidColorKey(colorKey)) return { error: "נא לבחור צבע" };

  const { error } = await supabase
    .from("leave_types")
    .update({
      label_he: labelHe,
      color_key: colorKey,
      weekend_applicable: weekendApplicable,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateLeaveTypeConsumers();
  return { ok: true };
}

export async function reorderLeaveTypes(
  orderedIds: string[],
): Promise<{ error?: string }> {
  if (!supabaseConfigured || !supabase) {
    return { error: "Supabase לא מחובר עדיין." };
  }
  const client = supabase;

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      client.from("leave_types").update({ sort_order: index + 1 }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidateLeaveTypeConsumers();
  return {};
}

export async function deleteLeaveType(
  _prevState: LeaveTypeActionState,
  formData: FormData,
): Promise<LeaveTypeActionState> {
  if (!supabaseConfigured || !supabase) {
    return { error: "Supabase לא מחובר עדיין." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "שגיאה — חסר מזהה" };

  const { error: purgeError } = await
    supabase
      .from("leave_requests")
      .delete()
      .eq("leave_type_id", id)
      .not("deleted_at", "is", null);

  if (purgeError) return { error: purgeError.message }

  const { error } = await supabase.from("leave_types").delete().eq("id", id);

  if (error) {
    // 23503 = foreign key violation (leave_requests.leave_type_id references this row)
    if (error.code === "23503") {
      return { error: "לא ניתן למחוק — קיימות בקשות חופשה מסוג זה" };
    }
    return { error: error.message };
  }

  revalidateLeaveTypeConsumers();
  return { ok: true };
}
