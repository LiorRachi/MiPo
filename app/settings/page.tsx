import { redirect } from "next/navigation";
import AddLeaveTypeForm from "@/components/AddLeaveTypeForm";
import AddUserForm from "@/components/AddUserForm";
import AppHeader from "@/components/AppHeader";
import BackButton from "@/components/BackButton";
import BottomNav from "@/components/BottomNav";
import FetchErrorScreen from "@/components/FetchErrorScreen";
import LeaveTypeList from "@/components/LeaveTypeList";
import LogoutButton from "@/components/LogoutButton";
import NotConfiguredScreen from "@/components/NotConfiguredScreen";
import ThemeToggle from "@/components/ThemeToggle";
import UserList from "@/components/UserList";
import { getCurrentUser } from "@/lib/auth";
import { fetchLeaveTypes, type LeaveType } from "@/lib/leave";
import { supabaseConfigured } from "@/lib/supabase/server";
import { fetchAllUsers, type Profile } from "@/lib/users";

export default async function Settings() {
  if (!supabaseConfigured) {
    return <NotConfiguredScreen active="settings" />;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  const isAdmin = currentUser.role === "admin";

  // Leave-type and user management are admin-only, but every logged-in user
  // reaches this page for the תצוגה (theme) section below — there's nowhere
  // else to change it. Only fetch the admin-only data when it'll be shown.
  let leaveTypes: LeaveType[] = [];
  let users: Profile[] = [];
  if (isAdmin) {
    try {
      [leaveTypes, users] = await Promise.all([
        fetchLeaveTypes(),
        fetchAllUsers(),
      ]);
    } catch {
      return <FetchErrorScreen active="settings" />;
    }
  }

  const nextSortOrder =
    leaveTypes.reduce((max, lt) => Math.max(max, lt.sort_order), 0) + 1;

  return (
    <div className="app-shell">
      <AppHeader showSettingsLink={false} userDisplayName={currentUser.displayName} />

      <BackButton />

      <h2 className="page-title">תצוגה</h2>
      <ThemeToggle />

      {isAdmin && (
        <>
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

          <h2 className="page-title">ניהול משתמשים</h2>

          <AddUserForm />

          {users.length === 0 ? (
            <div className="empty-week">אין עדיין משתמשים.</div>
          ) : (
            <UserList users={users} currentUserId={currentUser.id} />
          )}
        </>
      )}

      <h2 className="page-title">חשבון</h2>
      <LogoutButton />

      <BottomNav active="settings" />
    </div>
  );
}
