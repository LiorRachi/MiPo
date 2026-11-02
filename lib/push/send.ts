import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

const vapidConfigured = Boolean(publicKey && privateKey && subject);
if (vapidConfigured) {
  webpush.setVapidDetails(subject!, publicKey!, privateKey!);
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

/** Sends a web push notification to every subscription on file for each of
 * `profileIds`. No-ops when VAPID isn't configured — push is an optional
 * feature on top of the core app, never a precondition for it. A dead
 * subscription (the push service reports 404/410 — the browser data was
 * cleared, the app was uninstalled, or the user revoked permission) is
 * pruned so future sends don't keep retrying it; any other per-subscription
 * failure is swallowed, since one dead endpoint must not stop the rest from
 * being notified. Callers use this fire-and-forget — see lib/push/notify.ts. */
export async function sendPush(
  profileIds: string[],
  payload: PushPayload,
): Promise<void> {
  if (!vapidConfigured || profileIds.length === 0) return;
  const admin = createAdminClient();
  if (!admin) return;

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("profile_id", profileIds);
  if (!subs || subs.length === 0) return;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error("push send failed", sub.id, err);
        }
      }
    }),
  );
}
