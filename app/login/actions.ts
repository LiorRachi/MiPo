"use server";

import { redirect } from "next/navigation";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
};

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const supabase = await createClient();
  if (!supabaseConfigured || !supabase) {
    return { error: "Supabase לא מחובר עדיין." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !password) return { error: "נא להזין אימייל וסיסמה" };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "אימייל או סיסמה שגויים" };

  // "//evil.com" also starts with "/" but browsers resolve a protocol-relative
  // URL like that against the current scheme — i.e. straight off-site.
  const isSafeLocalPath = next.startsWith("/") && !next.startsWith("//");
  redirect(isSafeLocalPath ? next : "/");
}

export async function logout() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}
