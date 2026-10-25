import AddRequestSheet from "@/components/AddRequestSheet";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import FetchErrorScreen from "@/components/FetchErrorScreen";
import MonthCalendar, {
  type CalDay,
  type DayEntry,
} from "@/components/MonthCalendar";
import NotConfiguredScreen from "@/components/NotConfiguredScreen";
import { supabaseConfigured } from "@/lib/supabase";
import { fetchLeaveTypes, fetchRequestsInRange } from "@/lib/leave";
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

export default async function Overview({
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
    return <NotConfiguredScreen active="overview" />;
  }

  let leaveTypes;
  let requests;
  try {
    [leaveTypes, requests] = await Promise.all([
      fetchLeaveTypes(),
      fetchRequestsInRange(rangeStart, rangeEnd),
    ]);
  } catch {
    return <FetchErrorScreen active="overview" />;
  }

  const leaveTypeById = new Map(leaveTypes.map((lt) => [lt.id, lt]));

  const entriesByDay: Record<string, DayEntry[]> = {};
  for (const d of days) {
    const iso = toISODate(d);
    entriesByDay[iso] = requests
      .filter((r) => r.start_date <= iso && r.end_date >= iso)
      .map((r) => {
        const lt = leaveTypeById.get(r.leave_type_id);
        return {
          id: r.id,
          employee_name: r.employee_name,
          label_he: lt?.label_he ?? "",
          color_key: lt?.color_key ?? "other",
        };
      });
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
          אין עדיין סוגי חופשה. הוסיפו שורה ל-<code>leave_types</code> בסופאבייס.
        </div>
      ) : (
        <MonthCalendar
          key={monthKey}
          monthLabel={formatMonthHe(month)}
          prevMonthHref={`/overview?month=${prevMonth}`}
          nextMonthHref={`/overview?month=${nextMonth}`}
          days={calDays}
          entriesByDay={entriesByDay}
          initialSelected={initialSelected}
          leaveTypes={leaveTypes}
        />
      )}

      {leaveTypes.length > 0 && <AddRequestSheet leaveTypes={leaveTypes} />}
      <BottomNav active="overview" />
    </div>
  );
}
