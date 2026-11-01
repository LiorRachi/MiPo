import CopyDayButton from "./CopyDayButton";
import {
  approvedRequestsByTypeForDay,
  attendanceFromApprovedByType,
  formatAttendanceList,
  type LeaveRequest,
  type LeaveType,
} from "@/lib/leave/leave";
import { formatDayLabelHe, hebrewWeekdayLetter, isSameDay, toISODate } from "@/lib/utils/date";

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

  // Computed once per day and shared by both the header's copy-to-clipboard
  // text and the body's cells below, instead of each re-filtering
  // leaveTypes × requests on its own.
  const byDayApprovals = new Map(
    days.map((d) => [toISODate(d), approvedRequestsByTypeForDay(leaveTypes, requests, d)]),
  );

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
                      attendanceFromApprovedByType(
                        leaveTypes,
                        byDayApprovals.get(toISODate(d))!,
                        employeeNames,
                      ),
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
              const people = byDayApprovals.get(toISODate(d))!.get(lt.id) ?? [];
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
