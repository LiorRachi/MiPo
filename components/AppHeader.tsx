import Link from "next/link";

export default function AppHeader({
  showSettingsLink = true,
  userDisplayName,
}: {
  showSettingsLink?: boolean;
  userDisplayName?: string;
}) {
  return (
    <header className="app-header">
      <div className="app-title">
        <svg
          width="22"
          height="22"
          viewBox="0 0 120 120"
          aria-hidden="true"
          className="app-logo"
        >
          <rect width="120" height="120" rx="26" fill="#2f6fed" />
          <circle cx="41" cy="49" r="17" fill="#ffffff" />
          <circle cx="79" cy="49" r="17" fill="#ffffff" />
          <circle cx="60" cy="82" r="17" fill="#fbbf24" />
        </svg>
        <span className="app-title-text">
          MiPo <small>מי פה</small>
        </span>
      </div>
      <div className="app-header-actions">
        {userDisplayName ? (
          showSettingsLink ? (
            <Link
              href="/settings"
              className="avatar-circle"
              aria-label="הגדרות"
            >
              {userDisplayName.trim().charAt(0)}
            </Link>
          ) : (
            <span
              className="avatar-circle"
              aria-label={userDisplayName}
              title={userDisplayName}
            >
              {userDisplayName.trim().charAt(0)}
            </span>
          )
        ) : (
          showSettingsLink && (
            <Link href="/settings" className="icon-btn" aria-label="הגדרות">
              ⚙
            </Link>
          )
        )}
      </div>
    </header>
  );
}
