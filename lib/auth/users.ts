import type { CurrentUser } from "./auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "./userRoles";

export type { UserRole } from "./userRoles";

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  created_at: string;
};

/** Admin-only: the full account list, for the Settings → Users screen. Uses
 * the service-role client since listing every user is itself an admin-level
 * read. Takes the caller's already-resolved `currentUser` (from
 * getCurrentUser()) rather than re-deriving it, so every caller — all of
 * whom already have it — doesn't pay for a second auth+profile round trip
 * on top of its own. Still checks admin status itself rather than relying
 * solely on caller discipline, since the service-role client bypasses RLS
 * entirely. */
export async function fetchAllUsers(currentUser: CurrentUser): Promise<Profile[]> {
  if (currentUser.role !== "admin") return [];

  const admin = createAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, display_name, role, created_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
