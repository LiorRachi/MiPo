"use client";

import Link from "next/link";
import type { LeaveRequestStatus, LeaveType } from "@/lib/leave/leave";
import LeaveTypeLegend from "@/components/leave-types/LeaveTypeLegend";
import RequestRow from "@/components/requests/RequestRow";

const WEEKDAY_HEADERS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const MAX_VISIBLE_DOTS = 3;

export type CalDay = {
  iso: string;
  dayNum: number;
  inMonth: boolean;
  isToday: boolean;
  label: string; // e.g. "יום א׳, 25/10"
};

export type DayEntry = {
  id: string;
  employee_name: string;
  label_he: string;
  color_key: string;
  reason: string | null;
  status: LeaveRequestStatus;
  leave_type_id: string;
  date: string;
  end_date: string;
  decided_by_name: string | null;
  decided_at: string | null;
};

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export default function MonthCalendar({
  monthLabel,
  prevMonthHref,
  nextMonthHref,
  days,
  entriesByDay,
  selected,
  onSelect,
  leaveTypes,
  onRequestDeleted,
  isAdmin,
  employeeNames,
  currentUserDisplayName,
}: {
  monthLabel: string;
  prevMonthHref: string;
  nextMonthHref: string;
  days: CalDay[];
  entriesByDay: Record<string, DayEntry[]>;
  selected: string;
  onSelect: (iso: string) => void;
  leaveTypes: LeaveType[];
  onRequestDeleted?: (id: string, employeeName: string) => void;
  isAdmin: boolean;
  employeeNames: string[];
  currentUserDisplayName: string;
}) {
  const selectedDay = days.find((d) => d.iso === selected);
  const selectedEntries = entriesByDay[selected] ?? [];
  const weeks = chunk(days, 7);

  return (
    <>
      <div className="cal-card">
        <div className="cal-head">
          <Link href={prevMonthHref} aria-label="חודש קודם">
            ‹
          </Link>
          <div className="m-label">{monthLabel}</div>
          <Link href={nextMonthHref} aria-label="חודש הבא">
            ›
          </Link>
        </div>
        <div className="cal-grid" role="grid" aria-label={monthLabel}>
          <div role="row" style={{ display: "contents" }}>
            {WEEKDAY_HEADERS.map((wd) => (
              <div key={wd} className="cal-wd" role="columnheader">
                {wd}
              </div>
            ))}
          </div>
          {weeks.map((week, i) => (
            <div key={i} role="row" style={{ display: "contents" }}>
              {week.map((d) => {
                const dots = (entriesByDay[d.iso] ?? []).map(
                  (e) => e.color_key,
                );
                return (
                  <button
                    key={d.iso}
                    type="button"
                    role="gridcell"
                    className={[
                      "cal-cell",
                      d.isToday && "today",
                      !d.inMonth && "muted",
                      selected === d.iso && "selected",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => onSelect(d.iso)}
                    aria-label={`${d.label}${dots.length > 0 ? `, ${dots.length} בקשות` : ""}`}
                    aria-current={d.isToday ? "date" : undefined}
                    aria-selected={selected === d.iso}
                  >
                    {d.dayNum}
                    {dots.length > 0 && (
                      <span className="dots">
                        {dots.slice(0, MAX_VISIBLE_DOTS).map((colorKey, i) => (
                          <span key={i} className={`dot ${colorKey}`} />
                        ))}
                      </span>
                    )}
                    {dots.length > MAX_VISIBLE_DOTS && (
                      <span className="dot-more">
                        +{dots.length - MAX_VISIBLE_DOTS}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <LeaveTypeLegend leaveTypes={leaveTypes} className="cal-legend" />
      </div>

      <div className="day-detail">
        <h4>{selectedDay?.label}</h4>
        <div className="day-detail-list">
          {selectedEntries.length === 0 ? (
            <div className="empty-state">אין היעדרויות 🎉</div>
          ) : (
            selectedEntries.map((e) => (
              <RequestRow
                key={e.id}
                id={e.id}
                employeeName={e.employee_name}
                labelHe={e.label_he}
                colorKey={e.color_key}
                reason={e.reason}
                status={e.status}
                leaveTypeId={e.leave_type_id}
                date={e.date}
                endDate={e.end_date}
                decidedByName={e.decided_by_name}
                decidedAt={e.decided_at}
                leaveTypes={leaveTypes}
                onDeleted={onRequestDeleted}
                isAdmin={isAdmin}
                employeeNames={employeeNames}
                currentUserDisplayName={currentUserDisplayName}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
