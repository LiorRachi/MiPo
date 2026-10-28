import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import FetchErrorScreen from "@/components/FetchErrorScreen";
import type { CalDay, DayEntry } from "@/components/MonthCalendar";
import NotConfiguredScreen from "@/components/NotConfiguredScreen";
import RequestsCalendar from "@/components/RequestsCalendar";
import { supabaseConfigured } from "@/lib/supabase";
import {
  fetchLeaveTypes,
  fetchRequestsInRange,
  isVisibleOnDay,
} from "@/lib/leave";
import {
  addMonths,
  formatDayLabelHe,
  formatMonthHe,
  isSameDay,
  monthGrid,
  monthStart,
  parseISOMonth,
  toISODate,
  toISOMonth,
  todayInIsrael,
} from "@/lib/date";

export default async function Requests({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const today = todayInIsrael();
  const requestedMonth = sp.month ? parseISOMonth(sp.month) : null;
  const month = monthStart(requestedMonth ?? today);
  const days = monthGrid(month);
  const rangeStart = toISODate(days[0]);
  const rangeEnd = toISODate(days[days.length - 1]);

  const prevMonth = toISOMonth(addMonths(month, -1));
  const nextMonth = toISOMonth(addMonths(month, 1));
  const monthKey = toISOMonth(month);

  if (!supabaseConfigured) {
    return <NotConfiguredScreen active="requests" />;
  }

  let leaveTypes;
  let requests;
  try {
    [leaveTypes, requests] = await Promise.all([
      fetchLeaveTypes(),
      fetchRequestsInRange(rangeStart, rangeEnd),
    ]);
  } catch {
    return <FetchErrorScreen active="requests" />;
  }

  const leaveTypeById = new Map(leaveTypes.map((lt) => [lt.id, lt]));

  const entriesByDay: Record<string, DayEntry[]> = {};
  for (const d of days) {
    const iso = toISODate(d);
    entriesByDay[iso] = requests
      .filter((r) => {
        if (r.start_date > iso || r.end_date < iso) return false;
        const lt = leaveTypeById.get(r.leave_type_id);
        if (lt && !isVisibleOnDay(lt, d)) return false;
        return true;
      })
      .map((r) => {
        const lt = leaveTypeById.get(r.leave_type_id);
        return {
          id: r.id,
          employee_name: r.employee_name,
          label_he: lt?.label_he ?? "",
          color_key: lt?.color_key ?? "other",
          reason: r.reason,
          status: r.status,
          leave_type_id: r.leave_type_id,
          date: r.start_date,
        };
      })
      .sort((a, b) => a.employee_name.localeCompare(b.employee_name, "he"));
  }

  const calDays: CalDay[] = days.map((d) => {
    const iso = toISODate(d);
    return {
      iso,
      dayNum: d.getDate(),
      inMonth: d.getMonth() === month.getMonth(),
      isToday: isSameDay(d, today),
      label: formatDayLabelHe(d),
    };
  });

  const todayInGrid = calDays.find((d) => d.iso === toISODate(today));
  const initialSelected = todayInGrid?.inMonth
    ? todayInGrid.iso
    : (calDays.find((d) => d.inMonth)?.iso ?? calDays[0].iso);

  return (
    <div className="app-shell">
      <AppHeader />

      {leaveTypes.length === 0 ? (
        <div className="empty-week">
          אין עדיין סוגי חופשה. הוסיפו שורה ל-<code>leave_types</code>{" "}
          בסופאבייס.
        </div>
      ) : (
        <RequestsCalendar
          key={monthKey}
          monthLabel={formatMonthHe(month)}
          prevMonthHref={`/requests?month=${prevMonth}`}
          nextMonthHref={`/requests?month=${nextMonth}`}
          days={calDays}
          entriesByDay={entriesByDay}
          initialSelected={initialSelected}
          leaveTypes={leaveTypes}
        />
      )}

      <BottomNav active="requests" />
    </div>
  );
}
