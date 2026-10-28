import { requireAdmin } from "./auth";
import { createAdminClient } from "./supabase/admin";

export type UserRole = "admin" | "employee";

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  created_at: string;
};

/** Admin-only: the full account list, for the Settings → Users screen. Uses
 * the service-role client since listing every user is itself an admin-level
 * read. Checks admin status itself rather than relying solely on caller
 * discipline, since the service-role client bypasses RLS entirely. */
export async function fetchAllUsers(): Promise<Profile[]> {
  const auth = await requireAdmin();
  if ("error" in auth) return [];

  const admin = createAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, display_name, role, created_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
