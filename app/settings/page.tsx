import { redirect } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/shared/AppHeader";
import BackButton from "@/components/shared/BackButton";
import BottomNav from "@/components/shared/BottomNav";
import ErrorScreen from "@/components/shared/ErrorScreen";
import LogoutButton from "@/components/auth/LogoutButton";
import NotificationToggle from "@/components/shared/NotificationToggle";
import SectionTitle from "@/components/shared/SectionTitle";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { getCurrentUser } from "@/lib/auth/auth";
import { supabaseConfigured } from "@/lib/supabase/server";

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41 13.42 20.59a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

const ADMIN_LINKS = [
  { href: "/settings/leave-types", label: "ניהול סוגי בקשות יציאה", icon: <TagIcon /> },
  { href: "/settings/users", label: "ניהול משתמשים", icon: <UsersIcon /> },
  { href: "/settings/audit-log", label: "יומן פעולות מנהל", icon: <ListIcon /> },
] as const;

export default async function Settings() {
  if (!supabaseConfigured) {
    return <ErrorScreen active="settings" />;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  const isAdmin = currentUser.role === "admin";

  return (
    <div className="app-shell">
      <AppHeader
        showSettingsLink={false}
        userDisplayName={currentUser.displayName}
      />

      <div className="app-main">
        <BackButton />

        <SectionTitle icon={<SunIcon />} tone="medical">תצוגה</SectionTitle>
        <ThemeToggle />

        <SectionTitle icon={<BellIcon />} tone="rose">התראות</SectionTitle>
        <NotificationToggle />

        {isAdmin && (
          <>
            <SectionTitle icon={<SlidersIcon />} tone="other">ניהול</SectionTitle>
            <div className="settings-list">
              {ADMIN_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="settings-row settings-nav-row">
                  <span className="settings-nav-icon other">{link.icon}</span>
                  <span className="settings-nav-label">{link.label}</span>
                  <span className="settings-nav-chevron">›</span>
                </Link>
              ))}
            </div>
          </>
        )}

        <SectionTitle icon={<UserIcon />} tone="teal">חשבון</SectionTitle>
        <div className="settings-row settings-standalone-row">
          <div className="field">
            <label>שם מלא</label>
            <div className="static-value">{currentUser.displayName}</div>
          </div>
          <div className="field">
            <label>אימייל</label>
            <div className="static-value">{currentUser.email}</div>
          </div>
        </div>
        <LogoutButton />
      </div>

      <BottomNav active="settings" currentUserId={currentUser.id} isAdmin={isAdmin} />
    </div>
  );
}
