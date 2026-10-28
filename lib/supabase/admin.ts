import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const adminConfigured = Boolean(url && serviceRoleKey);

/** Service-role client for user-account management only (creating/deleting
 * Supabase Auth users via the admin API) — bypasses RLS entirely, so every
 * caller must independently verify the current session belongs to an admin
 * before using this. Never import this module from client code; `server-only`
 * turns that into a build error. */
export function createAdminClient() {
  if (!adminConfigured) return null;

  return createSupabaseClient(url!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
