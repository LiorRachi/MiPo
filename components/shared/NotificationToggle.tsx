"use client";

import { useEffect, useState, useTransition } from "react";
import { subscribeToPush } from "@/lib/push/subscribe";

// Inlined at build time by Next (NEXT_PUBLIC_ prefix) — safe to expose, only
// the matching private key (server-only) can actually sign a push.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// The Push API wants the VAPID public key as a raw Uint8Array, but it's
// handed out base64url-encoded (-/_ instead of +/, no padding) — browsers'
// built-in atob() only understands standard base64, hence the conversion.
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type Status = "idle" | "subscribed" | "unsupported" | "denied";

export default function NotificationToggle() {
  // Always starts "idle" on both server and first client render — browser
  // support, permission, and any existing subscription are all client-only
  // facts, resolved below in an effect (which only ever runs on the
  // client, after hydration) rather than branched on during the initial
  // render, which would make the server and client disagree on that first
  // render and trigger a hydration-mismatch error.
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function resolveStatus(): Promise<Status> {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return "unsupported";
      }
      if (typeof Notification !== "undefined" && Notification.permission === "denied") {
        return "denied";
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription ? "subscribed" : "idle";
    }
    resolveStatus().then(setStatus);
  }, []);

  function enable() {
    if (!VAPID_PUBLIC_KEY) {
      setError("התראות לא הוגדרו בשרת.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus(permission === "denied" ? "denied" : "idle");
          return;
        }
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          // Uint8Array<ArrayBufferLike> vs. lib.dom's more specific
          // BufferSource is a TS lib-typing mismatch, not a real one — a
          // Uint8Array satisfies BufferSource at runtime regardless.
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });
        const result = await subscribeToPush(
          subscription.toJSON() as {
            endpoint: string;
            keys: { p256dh: string; auth: string };
          },
        );
        if (result.error) {
          setError(result.error);
          return;
        }
        setStatus("subscribed");
      } catch {
        setError("ההפעלה נכשלה — נסו שוב.");
      }
    });
  }

  return (
    <div className="settings-row settings-standalone-row">
      <div className="field">
        <label>התראות</label>
        {status === "unsupported" && (
          <div className="static-value">הדפדפן הזה לא תומך בהתראות.</div>
        )}
        {status === "denied" && (
          <div className="static-value">
            ההתראות נחסמו בדפדפן — יש לאשר אותן בהגדרות הדפדפן.
          </div>
        )}
        {status === "idle" && (
          <button type="button" className="btn primary" onClick={enable} disabled={isPending}>
            {isPending ? "מפעיל..." : "הפעלת התראות"}
          </button>
        )}
        {status === "subscribed" && <div className="static-value">התראות מופעלות ✓</div>}
        {error && <div className="form-error">{error}</div>}
      </div>
    </div>
  );
}
