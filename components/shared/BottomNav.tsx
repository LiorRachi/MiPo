"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  markDecisionsSeen,
  useHasUnseenDecision,
} from "@/lib/hooks/useUnseenDecisions";

export type ActiveScreen = "table" | "requests" | "overview" | "settings";

export default function BottomNav({
  active,
  currentUserId,
  latestOwnDecisionAt = null,
}: {
  active: ActiveScreen;
  // Optional: unknown wherever no session exists yet to read it from (the
  // not-configured screen, shown before Supabase is even set up). The dot
  // just stays off in that case.
  currentUserId?: string;
  latestOwnDecisionAt?: string | null;
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
      <Link href="/" className={active === "table" ? "active" : ""}>
        <span className="ic">▦</span>
        לוח
      </Link>
      <Link
        href="/requests"
        className={active === "requests" ? "active" : ""}
        aria-label={
          hasUnseen && active !== "requests" ? "בקשות, עדכון חדש" : undefined
        }
      >
        <span className="ic">
          ◉
          {hasUnseen && active !== "requests" && (
            <span className="unread-dot" aria-hidden="true" />
          )}
        </span>
        בקשות
      </Link>
      <Link href="/overview" className={active === "overview" ? "active" : ""}>
        <span className="ic">⊞</span>
        סיכום
      </Link>
    </nav>
  );
}
