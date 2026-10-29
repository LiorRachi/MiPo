import CopyDayButton from "./CopyDayButton";
import {
  attendanceForDay,
  formatAttendanceList,
  isApprovedOnDay,
  type LeaveRequest,
  type LeaveType,
} from "@/lib/leave";
import { formatDayLabelHe, hebrewWeekdayLetter, isSameDay, toISODate } from "@/lib/date";

export default function WeekGrid({
  leaveTypes,
  days,
  requests,
  employeeNames,
  today,
  isAdmin,
}: {
  leaveTypes: LeaveType[];
  days: Date[];
  requests: LeaveRequest[];
  employeeNames: string[];
  today: Date;
  isAdmin: boolean;
}) {
  if (leaveTypes.length === 0) {
    return (
      <div className="grid-wrap">
        <div className="empty-week">
          אין עדיין סוגי חופשה. הוסיפו שורה ל-<code>leave_types</code> בסופאבייס.
        </div>
      </div>
    );
  }

  return (
    <div className="grid-wrap">
      <div className="grid" role="table" aria-label="טבלת בקשות חופשה שבועית">
        <div role="row" style={{ display: "contents" }}>
          {days.map((d) => {
            const isToday = isSameDay(d, today);
            return (
              <div
                key={toISODate(d)}
                className={`day-col${isToday ? " today" : ""}`}
                role="columnheader"
                aria-label={formatDayLabelHe(d)}
              >
                <span className="wd">{hebrewWeekdayLetter(d)}</span>
                {isAdmin ? (
                  <CopyDayButton
                    dayNumber={d.getDate()}
                    isToday={isToday}
                    attendanceText={formatAttendanceList(
                      attendanceForDay(leaveTypes, requests, employeeNames, d),
                    )}
                    ariaLabel={`העתקת רשימת נוכחות ל${formatDayLabelHe(d)}`}
                  />
                ) : (
                  <span className={`dn static${isToday ? " today" : ""}`}>
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
              const people = requests.filter((r) => isApprovedOnDay(r, lt, d));
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
    </div>
  );
}
