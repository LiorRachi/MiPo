import AddLeaveTypeForm from "@/components/AddLeaveTypeForm";
import AppHeader from "@/components/AppHeader";
import BackButton from "@/components/BackButton";
import BottomNav from "@/components/BottomNav";
import FetchErrorScreen from "@/components/FetchErrorScreen";
import LeaveTypeList from "@/components/LeaveTypeList";
import NotConfiguredScreen from "@/components/NotConfiguredScreen";
import ThemeToggle from "@/components/ThemeToggle";
import { fetchLeaveTypes } from "@/lib/leave";
import { supabaseConfigured } from "@/lib/supabase";

export default async function Settings() {
  if (!supabaseConfigured) {
    return <NotConfiguredScreen active="settings" />;
  }

  let leaveTypes;
  try {
    leaveTypes = await fetchLeaveTypes();
  } catch {
    return <FetchErrorScreen active="settings" />;
  }

  const nextSortOrder =
    leaveTypes.reduce((max, lt) => Math.max(max, lt.sort_order), 0) + 1;

  return (
    <div className="app-shell">
      <AppHeader showSettingsLink={false} />

      <BackButton />

      <h2 className="page-title">תצוגה</h2>
      <ThemeToggle />

      <h2 className="page-title">ניהול סוגי בקשות יציאה</h2>

      <AddLeaveTypeForm nextSortOrder={nextSortOrder} />

      {leaveTypes.length === 0 ? (
        <div className="empty-week">אין עדיין סוגי חופשה.</div>
      ) : (
        <LeaveTypeList
          key={leaveTypes
            .map((lt) => lt.id)
            .sort()
            .join(",")}
          leaveTypes={leaveTypes}
        />
      )}

      <BottomNav active="settings" />
    </div>
  );
}
