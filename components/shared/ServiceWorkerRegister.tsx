"use client";

import { useEffect } from "react";

/** Registers public/sw.js on every page load — needed for both PWA
 * installability and push notifications (NotificationToggle's subscribe
 * flow waits on navigator.serviceWorker.ready). Renders nothing; mounted
 * once from the root layout. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
