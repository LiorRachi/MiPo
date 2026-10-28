"use server";

import { revalidatePath } from "next/cache";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { isValidColorKey } from "@/lib/leaveTypeColors";
import type { UserRole } from "@/lib/users";

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
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
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
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
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
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
  if (!supabaseConfigured || !supabase) {
    return { error: "Supabase לא מחובר עדיין." };
  }

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("leave_types").update({ sort_order: index + 1 }).eq("id", id),
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
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
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

export type UserActionState = {
  error?: string;
  ok?: boolean;
};

function isValidRole(value: string): value is UserRole {
  return value === "admin" || value === "employee";
}

function revalidateUserConsumers() {
  revalidatePath("/settings");
}

export async function createUser(
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  if (!admin) return { error: "Supabase לא מחובר עדיין." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const role = String(formData.get("role") ?? "employee").trim();

  if (!email) return { error: "נא להזין אימייל" };
  if (!displayName) return { error: "נא להזין שם" };
  if (password.length < 8) return { error: "הסיסמה חייבת לכלול לפחות 8 תווים" };
  if (!isValidRole(role)) return { error: "תפקיד לא תקין" };

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) return { error: error.message };

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    email,
    display_name: displayName,
    role,
  });
  if (profileError) {
    // Roll back the auth account so a failed profile insert doesn't leave an
    // orphaned login nothing in the UI can see or manage.
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: profileError.message };
  }

  revalidateUserConsumers();
  return { ok: true };
}

export async function updateUser(
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  if (!admin) return { error: "Supabase לא מחובר עדיין." };

  const id = String(formData.get("id") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!id) return { error: "שגיאה — חסר מזהה" };
  if (!displayName) return { error: "נא להזין שם" };
  if (!isValidRole(role)) return { error: "תפקיד לא תקין" };
  if (password && password.length < 8) {
    return { error: "הסיסמה חייבת לכלול לפחות 8 תווים" };
  }
  if (role !== "admin" && id === auth.user.id) {
    return { error: "לא ניתן להסיר הרשאת מנהל מהחשבון שלך" };
  }

  if (password) {
    const { error } = await admin.auth.admin.updateUserById(id, { password });
    if (error) return { error: error.message };
  }

  const { error } = await admin
    .from("profiles")
    .update({ display_name: displayName, role })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateUserConsumers();
  return { ok: true };
}

export async function deleteUser(
  _prevState: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const admin = createAdminClient();
  if (!admin) return { error: "Supabase לא מחובר עדיין." };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "שגיאה — חסר מזהה" };
  if (id === auth.user.id) return { error: "לא ניתן למחוק את החשבון שלך" };

  // Deleting the auth user cascades to its profiles row (FK on delete cascade).
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: error.message };

  revalidateUserConsumers();
  return { ok: true };
}
