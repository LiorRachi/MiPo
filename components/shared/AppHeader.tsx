import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/auth";
import Logo from "./Logo";

export default async function AppHeader({
  showSettingsLink = true,
  userDisplayName,
}: {
  showSettingsLink?: boolean;
  userDisplayName?: string;
}) {
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.role === "admin";
  const initial = userDisplayName?.trim().charAt(0);

  return (
    <header className="app-header">
      <div className="app-title">
        <Logo size={22} className="app-logo" />
        <span className="app-title-text">
          MiPo <small>מי פה</small>
        </span>
      </div>
      {initial && (
        <div className="app-header-actions">
          <span className="avatar-wrap">
            {showSettingsLink ? (
              <Link href="/settings" className="avatar-circle" aria-label="הגדרות">
                {initial}
              </Link>
            ) : (
              <span
                className="avatar-circle"
                aria-label={userDisplayName}
                title={userDisplayName}
              >
                {initial}
              </span>
            )}
            {isAdmin && (
              <span className="admin-badge" title="מנהל/ת" aria-label="מנהל/ת">
                מנהל
              </span>
            )}
          </span>
        </div>
      )}
    </header>
  );
}
