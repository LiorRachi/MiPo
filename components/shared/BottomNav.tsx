"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  markDecisionsSeen,
  useHasUnseenDecision,
} from "@/lib/hooks/useUnseenDecisions";

export type ActiveScreen = "table" | "requests" | "overview" | "settings";

// Matches the stroke-icon style already used elsewhere (settings links,
// audit log) — stroke="currentColor" so .tabbar a.active's color applies to
// the icon too, not just the label underneath it.
function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

export default function BottomNav({
  active,
  currentUserId,
  latestOwnDecisionAt = null,
  isAdmin = false,
}: {
  active: ActiveScreen;
  // Optional: unknown wherever no session exists yet to read it from (the
  // not-configured screen, shown before Supabase is even set up). The dot
  // just stays off in that case.
  currentUserId?: string;
  latestOwnDecisionAt?: string | null;
  // Defaults to false (hiding the "סקירה שבועית" tab) wherever the caller
  // doesn't know yet — the table page is admin-only, so that's the safe default.
  isAdmin?: boolean;
}) {
  const hasUnseen = useHasUnseenDecision(currentUserId ?? null, latestOwnDecisionAt);

  // Being on the requests page counts as having seen it — once a real
  // decision timestamp is known, this persists it so the dot stays gone.
  useEffect(() => {
    if (active === "requests" && currentUserId && latestOwnDecisionAt) {
      markDecisionsSeen(currentUserId, latestOwnDecisionAt);
    }
  }, [active, currentUserId, latestOwnDecisionAt]);

  return (
    <nav className="tabbar">
      {isAdmin && (
        <Link href="/" className={active === "table" ? "active" : ""}>
          <span className="ic">
            <GridIcon />
          </span>
          סקירה שבועית
        </Link>
      )}
      <Link
        href="/requests"
        className={active === "requests" ? "active" : ""}
        aria-label={
          hasUnseen && active !== "requests" ? "בקשות, עדכון חדש" : undefined
        }
      >
        <span className="ic">
          <ClipboardIcon />
          {hasUnseen && active !== "requests" && (
            <span className="unread-dot" aria-hidden="true" />
          )}
        </span>
        בקשות
      </Link>
      <Link href="/overview" className={active === "overview" ? "active" : ""}>
        <span className="ic">
          <BarChartIcon />
        </span>
        סיכום חודשי
      </Link>
    </nav>
  );
}
