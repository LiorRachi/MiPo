import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && publishableKey);

/** Request-scoped Supabase client for Server Components/Actions, bound to
 * the caller's own session via cookies — every query runs as that logged-in
 * user, so RLS (`to authenticated`) applies. Create a fresh one per request;
 * it can't be a module-level singleton since it reads the request's cookies. */
export async function createClient() {
  if (!supabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(url!, publishableKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, which can't set cookies — the
          // middleware's own client refreshes the session instead.
        }
      },
    },
  });
}

export type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;

/** Shared by every Server Action that just needs "a configured client" before
 * doing its own thing (auth check, validation, etc.) — the one not-configured
 * message so it can't drift between call sites. */
export async function requireSupabaseClient(): Promise<
  { error: string } | { supabase: SupabaseServerClient }
> {
  const supabase = await createClient();
  if (!supabaseConfigured || !supabase) {
    return { error: "Supabase לא מחובר עדיין." };
  }
  return { supabase };
}
