"use client";

import Link from "next/link";
import { useState } from "react";
import type { LeaveType } from "@/lib/leave";

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
  initialSelected,
  leaveTypes,
}: {
  monthLabel: string;
  prevMonthHref: string;
  nextMonthHref: string;
  days: CalDay[];
  entriesByDay: Record<string, DayEntry[]>;
  initialSelected: string;
  leaveTypes: LeaveType[];
}) {
  const [selected, setSelected] = useState(initialSelected);
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
                    onClick={() => setSelected(d.iso)}
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
        <div className="cal-legend">
          {leaveTypes.map((lt) => (
            <span key={lt.id}>
              <span className={`dot ${lt.color_key}`} />
              {lt.label_he}
            </span>
          ))}
        </div>
      </div>

      <div className="day-detail">
        <h4>{selectedDay?.label}</h4>
        <div className="day-detail-list">
          {selectedEntries.length === 0 ? (
            <div className="empty-state">אין היעדרויות 🎉</div>
          ) : (
            selectedEntries.map((e) => (
              <div key={e.id} className="req-row">
                <div className="who">
                  <span className={`dot ${e.color_key}`} />
                  {e.employee_name}
                </div>
                <span className={`type-tag ${e.color_key}`}>{e.label_he}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
