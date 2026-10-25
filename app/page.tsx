import Link from "next/link";
import AddRequestSheet from "@/components/AddRequestSheet";
import { supabaseConfigured } from "@/lib/supabase";
import { fetchLeaveTypes, fetchRequestsInRange } from "@/lib/leave";
import {
  addDays,
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
    return (
      <div className="app-shell">
        <header className="app-header">
          <div className="app-title">
            MiPo <small>מי פה</small>
          </div>
        </header>
        <div className="setup-notice">
          Supabase עוד לא מחובר. הוסיפו <code>NEXT_PUBLIC_SUPABASE_URL</code> ו-
          <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> לקובץ <code>.env.local</code>,
          הריצו את <code>supabase/schema.sql</code> בעורך ה-SQL של הפרויקט, ואתחלו
          את השרת.
        </div>
      </div>
    );
  }

  let leaveTypes;
  let requests;
  try {
    [leaveTypes, requests] = await Promise.all([
      fetchLeaveTypes(),
      fetchRequestsInRange(rangeStart, rangeEnd),
    ]);
  } catch {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div className="app-title">
            MiPo <small>מי פה</small>
          </div>
        </header>
        <div className="setup-notice">
          שגיאה בטעינת הנתונים מסופאבייס. נסו לרענן את העמוד; אם זה חוזר, בדקו
          את חיבור הרשת ואת מדיניות ה-RLS בפרויקט.
        </div>
      </div>
    );
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
      <header className="app-header">
        <div className="app-title">
          MiPo <small>מי פה</small>
        </div>
      </header>

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
          <table className="grid">
            <thead>
              <tr>
                <th className="label-col"></th>
                {days.map((d) => {
                  const today_ = isSameDay(d, today);
                  return (
                    <th key={toISODate(d)} className={`day-col${today_ ? " today" : ""}`}>
                      <span className="wd">{hebrewWeekdayLetter(d)}</span>
                      <span className="dn">{d.getDate()}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {leaveTypes.map((lt) => (
                <tr key={lt.id}>
                  <td className="label-col">
                    <span className={`dot type-dot ${lt.color_key}`} />
                    {lt.label_he}
                  </td>
                  {days.map((d) => {
                    const people = cell(lt.id, d);
                    return (
                      <td key={toISODate(d)} className="day-cell">
                        <div className="cell-stack">
                          {people.map((p) => (
                            <div key={p.id} className={`chip ${lt.color_key}`}>
                              {p.employee_name}
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {leaveTypes.length > 0 && <AddRequestSheet leaveTypes={leaveTypes} />}
    </div>
  );
}
