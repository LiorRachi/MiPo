import { redirect } from "next/navigation";
import Link from "next/link";
import AddRequestSheet from "@/components/AddRequestSheet";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import FetchErrorScreen from "@/components/FetchErrorScreen";
import LeaveTypeLegend from "@/components/LeaveTypeLegend";
import NotConfiguredScreen from "@/components/NotConfiguredScreen";
import WeekGrid from "@/components/WeekGrid";
import { getCurrentUser } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/server";
import { fetchLeavePageData, type LeavePageData } from "@/lib/leave";
import {
  addDays,
  formatWeekRangeHe,
  isSameDay,
  parseISODate,
  toISODate,
  todayInIsrael,
  weekDays,
  weekStart,
} from "@/lib/date";

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
    return <NotConfiguredScreen active="table" />;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  const isAdmin = currentUser.role === "admin";

  let data: LeavePageData;
  try {
    data = await fetchLeavePageData(rangeStart, rangeEnd, currentUser);
  } catch {
    return <FetchErrorScreen active="table" />;
  }
  const { leaveTypes, requests, employeeNames } = data;

  return (
    <div className="app-shell">
      <AppHeader userDisplayName={currentUser.displayName} />

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

      {leaveTypes.length > 0 && (
        <AddRequestSheet
          leaveTypes={leaveTypes}
          isAdmin={isAdmin}
          employeeNames={employeeNames}
          currentUserDisplayName={currentUser.displayName}
        />
      )}
      <BottomNav active="table" />
    </div>
  );
}
