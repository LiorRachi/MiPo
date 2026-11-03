import { redirect } from "next/navigation";
import AppHeader from "@/components/shared/AppHeader";
import AuditLogFilters from "@/components/shared/AuditLogFilters";
import AuditLogList from "@/components/shared/AuditLogList";
import BackButton from "@/components/shared/BackButton";
import BottomNav from "@/components/shared/BottomNav";
import ErrorScreen from "@/components/shared/ErrorScreen";
import { getCurrentUser } from "@/lib/auth/auth";
import {
  auditActionCategory,
  auditResourceType,
  fetchAuditLog,
  type AuditActionCategory,
  type AuditLogEntry,
  type AuditResourceType,
} from "@/lib/auth/auditLog";
import { supabaseConfigured } from "@/lib/supabase/server";

export default async function SettingsAuditLog({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; resource?: string; actor?: string; sort?: string }>;
}) {
  if (!supabaseConfigured) {
    return <ErrorScreen active="settings" />;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.role !== "admin") redirect("/settings");

  let entries: AuditLogEntry[];
  try {
    entries = await fetchAuditLog(currentUser);
  } catch {
    return (
      <ErrorScreen
        active="settings"
        currentUserId={currentUser.id}
        userDisplayName={currentUser.displayName}
        isAdmin
      />
    );
  }

  const sp = await searchParams;
  const actionFilter = (sp.action ?? "") as AuditActionCategory | "";
  const resourceFilter = (sp.resource ?? "") as AuditResourceType | "";
  const actorFilter = sp.actor ?? "";
  const sort = sp.sort === "asc" ? "asc" : "desc";

  // Options for the actor filter always list everyone who has ever acted,
  // regardless of the other filters currently applied — derived from the
  // full fetch (below), not the filtered result.
  const actors = [...new Set(entries.map((e) => e.actor_name))].sort((a, b) =>
    a.localeCompare(b, "he"),
  );

  const filteredEntries = entries
    .filter((e) => !actionFilter || auditActionCategory(e.action) === actionFilter)
    .filter((e) => !resourceFilter || auditResourceType(e.action) === resourceFilter)
    .filter((e) => !actorFilter || e.actor_name === actorFilter)
    .sort((a, b) =>
      sort === "asc"
        ? a.created_at.localeCompare(b.created_at)
        : b.created_at.localeCompare(a.created_at),
    );

  return (
    <div className="app-shell">
      <AppHeader showSettingsLink={false} userDisplayName={currentUser.displayName} />

      <div className="app-main">
        <BackButton />

        <h2 className="page-title">יומן פעולות מנהל</h2>

        <AuditLogFilters
          actors={actors}
          action={actionFilter}
          resource={resourceFilter}
          actor={actorFilter}
          sort={sort}
        />

        <div className="audit-log-scroll">
          {filteredEntries.length === 0 ? (
            <div className="empty-week">אין פעולות התואמות את הסינון.</div>
          ) : (
            <AuditLogList entries={filteredEntries} />
          )}
        </div>
      </div>

      <BottomNav active="settings" currentUserId={currentUser.id} isAdmin />
    </div>
  );
}
