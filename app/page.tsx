import Link from "next/link";
import AddRequestSheet from "@/components/AddRequestSheet";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import FetchErrorScreen from "@/components/FetchErrorScreen";
import NotConfiguredScreen from "@/components/NotConfiguredScreen";
import { supabaseConfigured } from "@/lib/supabase";
import { fetchLeaveTypes, fetchRequestsInRange } from "@/lib/leave";
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

  let leaveTypes;
  let requests;
  try {
    [leaveTypes, requests] = await Promise.all([
      fetchLeaveTypes(),
      fetchRequestsInRange(rangeStart, rangeEnd),
    ]);
  } catch {
    return <FetchErrorScreen active="table" />;
  }

  const cell = (leaveTypeId: string, day: Date) => {
    const iso = toISODate(day);
    return requests.filter(
      (r) =>
        r.leave_type_id === leaveTypeId &&
        r.start_date <= iso &&
        r.end_date >= iso,
    );
  };

  return (
    <div className="app-shell">
      <AppHeader />

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
                    <span className="dn">{d.getDate()}</span>
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
                  const people = cell(lt.id, d);
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

      {leaveTypes.length > 0 && <AddRequestSheet leaveTypes={leaveTypes} />}
      <BottomNav active="table" />
    </div>
  );
}
