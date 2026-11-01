"use client";

import { useSyncExternalStore } from "react";

// Per-device "unread" tracking for the בקשות tab's dot — deliberately not a
// push notification (no service worker, no backend): just a reminder that
// shows next time the app is opened if one of the user's own requests was
// approved/denied since they last looked at the requests list. See the
// notifications discussion this was scoped down from.
function storageKey(userId: string): string {
  return `mipo:lastSeenDecisionAt:${userId}`;
}

function readLastSeen(userId: string): string | null {
  try {
    return localStorage.getItem(storageKey(userId));
  } catch {
    // localStorage unavailable (private browsing, etc.) — treat as unseen
    // rather than silently hiding a real decision.
    return null;
  }
}

// No-op: nothing in this tab changes localStorage out from under a mounted
// BottomNav (markDecisionsSeen only ever runs from an unmount-then-remount —
// see BottomNav's effect — and a write from another tab doesn't need to
// repaint this one's dot). useSyncExternalStore still re-reads the snapshot
// on every render, so a fresh mount after navigation always sees the latest
// value.
function subscribe() {
  return () => {};
}

/** Whether `currentUserId` has a decided request newer than the one they
 * last saw. `latestDecisionAt` is the most recent decided_at among their own
 * requests (see lib/leave.ts's latestOwnDecisionAt), or null if none are
 * decided. The server snapshot is always null (no localStorage during SSR),
 * matching the server-rendered markup until hydration reads the real value. */
export function useHasUnseenDecision(
  currentUserId: string | null,
  latestDecisionAt: string | null,
): boolean {
  const lastSeen = useSyncExternalStore(
    subscribe,
    () => (currentUserId ? readLastSeen(currentUserId) : null),
    () => null,
  );
  if (!latestDecisionAt) return false;
  return !lastSeen || latestDecisionAt > lastSeen;
}

/** Marks every decision up to `latestDecisionAt` as seen — call this once
 * the user is actually looking at their requests list. */
export function markDecisionsSeen(currentUserId: string, latestDecisionAt: string) {
  try {
    localStorage.setItem(storageKey(currentUserId), latestDecisionAt);
  } catch {
    // Ignore — worst case the badge just reappears next time.
  }
}
