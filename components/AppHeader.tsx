import Link from "next/link";

export default function AppHeader({
  showSettingsLink = true,
}: {
  showSettingsLink?: boolean;
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
      {showSettingsLink && (
        <Link
          href="/settings"
          className="icon-btn"
          aria-label="ניהול סוגי חופשה"
        >
          ⚙
        </Link>
      )}
    </header>
  );
}
