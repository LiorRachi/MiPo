import { redirect } from "next/navigation";
import AddUserFab from "@/components/users/AddUserFab";
import AppHeader from "@/components/shared/AppHeader";
import BackButton from "@/components/shared/BackButton";
import BottomNav from "@/components/shared/BottomNav";
import ErrorScreen from "@/components/shared/ErrorScreen";
import UserList from "@/components/users/UserList";
import { getCurrentUser } from "@/lib/auth/auth";
import { fetchAllUsers, type Profile, type UserRole } from "@/lib/auth/users";
import { supabaseConfigured } from "@/lib/supabase/server";

const ROLE_RANK: Record<UserRole, number> = { admin: 0, employee: 1 };

function byRoleThenName(a: Profile, b: Profile) {
  return ROLE_RANK[a.role] - ROLE_RANK[b.role] || a.display_name.localeCompare(b.display_name, "he");
}

export default async function SettingsUsers() {
  if (!supabaseConfigured) {
    return <ErrorScreen active="settings" />;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.role !== "admin") redirect("/settings");

  let users: Profile[];
  try {
    users = await fetchAllUsers(currentUser);
  } catch {
    return (
      <ErrorScreen
        active="settings"
        currentUserId={currentUser.id}
        userDisplayName={currentUser.displayName}
      />
    );
  }

  return (
    <div className="app-shell">
      <AppHeader showSettingsLink={false} userDisplayName={currentUser.displayName} />

      <div className="app-main">
        <BackButton />

        <h2 className="page-title">ניהול משתמשים</h2>

        {users.length === 0 ? (
          <div className="empty-week">אין עדיין משתמשים.</div>
        ) : (
          <UserList users={[...users].sort(byRoleThenName)} currentUserId={currentUser.id} />
        )}
      </div>

      <AddUserFab />

      <BottomNav active="settings" currentUserId={currentUser.id} />
    </div>
  );
}
