import { createClient } from "./supabase/server";
import type { UserRole } from "./users";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
};

/** The logged-in user's own profile, or null if not logged in or no profile
 * row exists for them yet. Server Components/Actions only (reads cookies). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    displayName: profile.display_name,
    role: profile.role,
  };
}

/** Guard for admin-only Server Actions (account management, leave-type
 * management): returns the current user if they're an admin, or an error
 * string ready to return directly from the action. Every action that touches
 * another user's account must call this itself — the Settings page hiding
 * the UI from non-admins is not a substitute, since actions are reachable
 * directly. */
export async function requireAdmin(): Promise<
  { user: CurrentUser } | { error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { error: "יש להתחבר מחדש." };
  if (user.role !== "admin") return { error: "פעולה זו דורשת הרשאת מנהל." };
  return { user };
}
