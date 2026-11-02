"use server";

import { getCurrentUser } from "@/lib/auth/auth";
import { requireSupabaseClient } from "@/lib/supabase/server";

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** Upserts the current user's push subscription (one row per browser/device
 * they've enabled notifications on — see NotificationToggle). Goes through
 * the upsert_push_subscription RPC rather than a plain table upsert — see
 * migration 20261101130916 for why a direct client-side upsert against this
 * table doesn't work under RLS. */
export async function subscribeToPush(
  subscription: PushSubscriptionInput,
): Promise<{ error?: string }> {
  const clientResult = await requireSupabaseClient();
  if ("error" in clientResult) return clientResult;
  const { supabase } = clientResult;

  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "יש להתחבר מחדש." };

  const { error } = await supabase.rpc("upsert_push_subscription", {
    p_endpoint: subscription.endpoint,
    p_p256dh: subscription.keys.p256dh,
    p_auth: subscription.keys.auth,
  });
  if (error) {
    console.error("subscribeToPush failed", { userId: currentUser.id, error });
    return { error: error.message };
  }

  return {};
}
