import { redirect } from "next/navigation";
import Link from "next/link";
import AddRequestSheet from "@/components/AddRequestSheet";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import CopyDayButton from "@/components/CopyDayButton";
import FetchErrorScreen from "@/components/FetchErrorScreen";
import NotConfiguredScreen from "@/components/NotConfiguredScreen";
import { getCurrentUser } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/server";
import { fetchAllUsers } from "@/lib/users";
import {
  attendanceForDay,
  fetchLeaveTypes,
  fetchRequestsInRange,
  formatAttendanceList,
  isVisibleOnDay,
} from "@/lib/leave";
import {
  addDays,
  formatDayLabelHe,
  formatWeekRangeHe,
  hebrewWeekdayLetter,
  isSameDay,
  parseISODate,
  toISODate,
  todayInIsrael,
  weekDays,
  weekStart,
} from "@/lib/date";
import type { LeaveType } from "@/lib/leave";

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

  let leaveTypes;
  let requests;
  let employeeNames: string[] = [];
  try {
    const [fetchedLeaveTypes, fetchedRequests, profiles] = await Promise.all([
      fetchLeaveTypes(),
      fetchRequestsInRange(
        rangeStart,
        rangeEnd,
        isAdmin ? undefined : currentUser.id,
      ),
      isAdmin ? fetchAllUsers() : Promise.resolve([]),
    ]);
    leaveTypes = fetchedLeaveTypes;
    requests = fetchedRequests;
    employeeNames = profiles.map((p) => p.display_name);
  } catch {
    return <FetchErrorScreen active="table" />;
  }

  const cell = (lt: LeaveType, day: Date) => {
    if (!isVisibleOnDay(lt, day)) return [];
    const iso = toISODate(day);
    return requests.filter(
      (r) =>
        r.leave_type_id === lt.id &&
        r.start_date <= iso &&
        r.end_date >= iso &&
        r.status === "approved",
    );
  };

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
        <div className="legend">
          {leaveTypes.map((lt) => (
            <span key={lt.id}>
              <span className={`dot ${lt.color_key}`} />
              {lt.label_he}
            </span>
          ))}
        </div>
      )}

      <div className="grid-wrap">
        {leaveTypes.length === 0 ? (
          <div className="empty-week">
            אין עדיין סוגי חופשה. הוסיפו שורה ל-<code>leave_types</code> בסופאבייס.
          </div>
        ) : (
          <div className="grid" role="table" aria-label="טבלת בקשות חופשה שבועית">
            <div role="row" style={{ display: "contents" }}>
              {days.map((d) => {
                const today_ = isSameDay(d, today);
                return (
                  <div
                    key={toISODate(d)}
                    className={`day-col${today_ ? " today" : ""}`}
                    role="columnheader"
                    aria-label={formatDayLabelHe(d)}
                  >
                    <span className="wd">{hebrewWeekdayLetter(d)}</span>
                    {isAdmin ? (
                      <CopyDayButton
                        dayNumber={d.getDate()}
                        isToday={today_}
                        attendanceText={formatAttendanceList(
                          attendanceForDay(leaveTypes, requests, d),
                        )}
                        ariaLabel={`העתקת רשימת נוכחות ל${formatDayLabelHe(d)}`}
                      />
                    ) : (
                      <span className={`dn static${today_ ? " today" : ""}`}>
                        {d.getDate()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {leaveTypes.map((lt, rowIndex) => (
              <div
                key={lt.id}
                role="row"
                aria-label={lt.label_he}
                style={{ display: "contents" }}
              >
                {days.map((d) => {
                  const people = cell(lt, d);
                  const names = people.map((p) => p.employee_name).join(", ");
                  return (
                    <div
                      key={`${lt.id}-${toISODate(d)}`}
                      className={`day-cell${rowIndex % 2 === 1 ? " alt" : ""}`}
                      role="cell"
                      aria-label={`${lt.label_he}, ${formatDayLabelHe(d)}${names ? `: ${names}` : ""}`}
                    >
                      <div className="cell-stack">
                        {people.map((p) => (
                          <div key={p.id} className={`chip ${lt.color_key}`}>
                            {p.employee_name}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

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
