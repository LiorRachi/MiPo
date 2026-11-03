import { redirect } from "next/navigation";
import AppHeader from "@/components/shared/AppHeader";
import BottomNav from "@/components/shared/BottomNav";
import ErrorScreen from "@/components/shared/ErrorScreen";
import OverviewFilters from "@/components/requests/OverviewFilters";
import type { OverviewRange } from "./range";
import { getCurrentUser } from "@/lib/auth/auth";
import { fetchAllUsers, type Profile } from "@/lib/auth/users";
import { supabaseConfigured } from "@/lib/supabase/server";
import {
  approvedDayCountsByType,
  fetchLeaveTypes,
  fetchRequestsInRange,
  type LeaveRequest,
  type LeaveType,
} from "@/lib/leave/leave";
import { monthStart, todayInIsrael, toISODate } from "@/lib/utils/date";

const RANGE_DAYS = 30;

function resolveRange(sp: { range?: string }): { start: Date; end: Date; range: OverviewRange } {
  const today = todayInIsrael();
  if (sp.range === "month") {
    return { start: monthStart(today), end: today, range: "month" };
  }
  const start = new Date(today);
  start.setDate(start.getDate() - (RANGE_DAYS - 1));
  return { start, end: today, range: "30d" };
}

export default async function Overview({
  searchParams,
}: {
  searchParams: Promise<{ employee?: string; range?: string }>;
}) {
  const sp = await searchParams;

  if (!supabaseConfigured) {
    return <ErrorScreen active="overview" />;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  const isAdmin = currentUser.role === "admin";
  const { start, end, range } = resolveRange(sp);

  let profiles: Profile[];
  let leaveTypes: LeaveType[];
  let requests: LeaveRequest[];
  let selectedProfileId: string;
  try {
    profiles = isAdmin ? await fetchAllUsers(currentUser) : [];
    selectedProfileId =
      isAdmin && sp.employee && profiles.some((p) => p.id === sp.employee)
        ? sp.employee
        : currentUser.id;
    [leaveTypes, requests] = await Promise.all([
      fetchLeaveTypes(),
      fetchRequestsInRange(toISODate(start), toISODate(end), selectedProfileId),
    ]);
  } catch {
    return (
      <ErrorScreen
        active="overview"
        currentUserId={currentUser.id}
        userDisplayName={currentUser.displayName}
      />
    );
  }

  const dayCounts = approvedDayCountsByType(leaveTypes, requests, start, end);

  return (
    <div className="app-shell">
      <AppHeader userDisplayName={currentUser.displayName} />

      <div className="app-main">
        <h2 className="page-title">סיכום יציאות</h2>

        <OverviewFilters
          isAdmin={isAdmin}
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          range={range}
        />

        <div className="overview-stats-grid">
          {leaveTypes.map((lt) => (
            <div key={lt.id} className={`overview-stat-tile ${lt.color_key}`}>
              <div className="overview-stat-number">{dayCounts.get(lt.id) ?? 0}</div>
              <div className="overview-stat-label">{lt.label_he}</div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav active="overview" currentUserId={currentUser.id} />
    </div>
  );
}
