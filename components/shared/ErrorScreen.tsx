import AppHeader from "./AppHeader";
import BottomNav, { type ActiveScreen } from "./BottomNav";

// Shown for the two cases where the app can't render its normal content:
// Supabase isn't configured at all (no session possible, so callers pass no
// currentUserId/userDisplayName) or a data fetch failed for an otherwise
// logged-in user (callers pass both, so the real avatar shows instead of
// AppHeader's own no-name fallback).
export default function ErrorScreen({
  active,
  currentUserId,
  userDisplayName,
  isAdmin = false,
}: {
  active: ActiveScreen;
  currentUserId?: string;
  userDisplayName?: string;
  isAdmin?: boolean;
}) {
  return (
    <div className="app-shell">
      <AppHeader
        showSettingsLink={active !== "settings"}
        userDisplayName={userDisplayName}
      />
      <div className="app-main">
        <div className="setup-notice">שגיאה — אנא חזרו מאוחר יותר.</div>
      </div>
      <BottomNav active={active} currentUserId={currentUserId} isAdmin={isAdmin} />
    </div>
  );
}
