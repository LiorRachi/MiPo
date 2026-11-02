"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
};

const WRONG_CREDENTIALS_ERROR = "אימייל או סיסמה שגויים";

// Brute-force lockout state lives in login_attempts, read/written through
// the admin client — this runs before any session exists, so the regular
// RLS-governed client can't touch it (see the migration's own comment). Each
// helper no-ops (fails open, i.e. skips the lockout feature) when the admin
// client isn't configured, since lockout is a defense-in-depth layer on top
// of login, not a precondition for it. The actual threshold (5 failures) and
// duration (15 minutes) live in the record_login_attempt_failure() SQL
// function (see migration 20261101121647) — incrementing and maybe locking
// has to happen as one atomic database statement, not a separate
// read-then-write here, or concurrent failures can race and lose a count.

async function isLockedOut(email: string): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;
  const { data } = await admin
    .from("login_attempts")
    .select("locked_until")
    .eq("email", email)
    .maybeSingle();
  return Boolean(data?.locked_until && new Date(data.locked_until) > new Date());
}

async function recordLoginFailure(email: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.rpc("record_login_attempt_failure", { p_email: email });
}

async function clearLoginFailures(email: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("login_attempts").delete().eq("email", email);
}

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

  // Normalized separately from `email` below — the lockout key shouldn't
  // care about casing, but the actual signInWithPassword call keeps using
  // whatever casing the user typed, unchanged from before this feature.
  const lockoutKey = email.toLowerCase();
  // Same generic message as a wrong password, on purpose — a distinct
  // "too many attempts" message would itself confirm the account exists.
  if (await isLockedOut(lockoutKey)) return { error: WRONG_CREDENTIALS_ERROR };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    await recordLoginFailure(lockoutKey);
    return { error: WRONG_CREDENTIALS_ERROR };
  }
  await clearLoginFailures(lockoutKey);

  // "//evil.com" also starts with "/" but browsers resolve a protocol-relative
  // URL like that against the current scheme — i.e. straight off-site. A
  // backslash anywhere is blocked too: browsers normalize "\" to "/" for
  // http(s) URLs, so "/\evil.com" would otherwise be treated the same way.
  const isSafeLocalPath =
    next.startsWith("/") && !next.startsWith("//") && !next.includes("\\");
  redirect(isSafeLocalPath ? next : "/");
}

export async function logout() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}
