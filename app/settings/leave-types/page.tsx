import { redirect } from "next/navigation";
import AddLeaveTypeFab from "@/components/leave-types/AddLeaveTypeFab";
import AppHeader from "@/components/shared/AppHeader";
import BackButton from "@/components/shared/BackButton";
import BottomNav from "@/components/shared/BottomNav";
import ErrorScreen from "@/components/shared/ErrorScreen";
import LeaveTypeList from "@/components/leave-types/LeaveTypeList";
import { getCurrentUser } from "@/lib/auth/auth";
import { fetchLeaveTypes, type LeaveType } from "@/lib/leave/leave";
import { supabaseConfigured } from "@/lib/supabase/server";

export default async function SettingsLeaveTypes() {
  if (!supabaseConfigured) {
    return <ErrorScreen active="settings" />;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.role !== "admin") redirect("/settings");

  let leaveTypes: LeaveType[];
  try {
    leaveTypes = await fetchLeaveTypes();
  } catch {
    return (
      <ErrorScreen
        active="settings"
        currentUserId={currentUser.id}
        userDisplayName={currentUser.displayName}
      />
    );
  }

  const nextSortOrder = leaveTypes.reduce((max, lt) => Math.max(max, lt.sort_order), 0) + 1;

  return (
    <div className="app-shell">
      <AppHeader showSettingsLink={false} userDisplayName={currentUser.displayName} />

      <div className="app-main">
        <BackButton />

        <h2 className="page-title">ניהול סוגי בקשות יציאה</h2>

        {leaveTypes.length === 0 ? (
          <div className="empty-week">אין עדיין סוגי בקשות יציאה.</div>
        ) : (
          <LeaveTypeList
            key={leaveTypes
              .map((lt) => lt.id)
              .sort()
              .join(",")}
            leaveTypes={leaveTypes}
          />
        )}
      </div>

      <AddLeaveTypeFab nextSortOrder={nextSortOrder} />

      <BottomNav active="settings" currentUserId={currentUser.id} />
    </div>
  );
}
