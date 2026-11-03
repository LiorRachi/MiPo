import { redirect } from "next/navigation";
import Link from "next/link";
import AddRequestSheet from "@/components/requests/AddRequestSheet";
import AppHeader from "@/components/shared/AppHeader";
import BottomNav from "@/components/shared/BottomNav";
import ErrorScreen from "@/components/shared/ErrorScreen";
import LeaveTypeLegend from "@/components/leave-types/LeaveTypeLegend";
import WeekGrid from "@/components/calendar/WeekGrid";
import { getCurrentUser } from "@/lib/auth/auth";
import { supabaseConfigured } from "@/lib/supabase/server";
import { fetchWeekPageData, latestOwnDecisionAt, type LeavePageData } from "@/lib/leave/leave";
import {
  addDays,
  formatWeekRangeHe,
  isSameDay,
  parseISODate,
  toISODate,
  todayInIsrael,
  weekDays,
  weekStart,
} from "@/lib/utils/date";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const sp = await searchParams;
  const today = todayInIsrael();
  const requestedWeek = sp.week ? parseISODate(sp.week) : null;
  const start = weekStart(requestedWeek ?? today);
  const days = weekDays(start);
  const rangeStart = toISODate(days[0]);
  const rangeEnd = toISODate(days[6]);

  const prevWeek = toISODate(addDays(start, -7));
  const nextWeek = toISODate(addDays(start, 7));
  const isCurrentWeek = isSameDay(start, weekStart(today));

  if (!supabaseConfigured) {
    return <ErrorScreen active="table" />;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  // The week grid shows the whole team's leave at a glance — admin-only for
  // privacy, unlike /requests which already scopes a non-admin to their own.
  if (currentUser.role !== "admin") redirect("/requests");
  const isAdmin = true;

  let data: LeavePageData;
  let latestDecisionAt: string | null;
  try {
    [data, latestDecisionAt] = await Promise.all([
      fetchWeekPageData(rangeStart, rangeEnd, currentUser),
      latestOwnDecisionAt(currentUser.id),
    ]);
  } catch {
    return (
      <ErrorScreen
        active="table"
        currentUserId={currentUser.id}
        userDisplayName={currentUser.displayName}
        isAdmin
      />
    );
  }
  const { leaveTypes, requests, employeeNames } = data;

  return (
    <div className="app-shell">
      <AppHeader userDisplayName={currentUser.displayName} />

      <div className="app-main">
        <div className="week-nav">
          <Link href={`/?week=${prevWeek}`} aria-label="שבוע קודם">
            ‹
          </Link>
          <div className="week-label">
            {isCurrentWeek && <span className="today-pill">השבוע</span>}
            {formatWeekRangeHe(days[0], days[6])}
          </div>
          <Link href={`/?week=${nextWeek}`} aria-label="שבוע הבא">
            ›
          </Link>
        </div>

        {leaveTypes.length > 0 && (
          <LeaveTypeLegend leaveTypes={leaveTypes} className="legend" />
        )}

        <WeekGrid
          leaveTypes={leaveTypes}
          days={days}
          requests={requests}
          employeeNames={employeeNames}
          today={today}
          isAdmin={isAdmin}
        />
      </div>

      {leaveTypes.length > 0 && (
        <AddRequestSheet
          leaveTypes={leaveTypes}
          isAdmin={isAdmin}
          employeeNames={employeeNames}
          currentUserDisplayName={currentUser.displayName}
        />
      )}
      <BottomNav
        active="table"
        currentUserId={currentUser.id}
        latestOwnDecisionAt={latestDecisionAt}
        isAdmin
      />
    </div>
  );
}
