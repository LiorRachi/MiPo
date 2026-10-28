"use client";

import { useState } from "react";
import { undoDeleteLeaveRequest } from "@/app/actions";
import type { LeaveType } from "@/lib/leave";
import { useAutoDismiss } from "@/lib/hooks/useAutoDismiss";
import { useUndoableDelete } from "@/lib/hooks/useUndoableDelete";
import AddRequestSheet from "./AddRequestSheet";
import MonthCalendar, { type CalDay, type DayEntry } from "./MonthCalendar";

export default function RequestsCalendar({
  monthLabel,
  prevMonthHref,
  nextMonthHref,
  days,
  entriesByDay,
  initialSelected,
  leaveTypes,
  isAdmin,
  employeeNames,
  currentUserDisplayName,
}: {
  monthLabel: string;
  prevMonthHref: string;
  nextMonthHref: string;
  days: CalDay[];
  entriesByDay: Record<string, DayEntry[]>;
  initialSelected: string;
  leaveTypes: LeaveType[];
  isAdmin: boolean;
  employeeNames: string[];
  currentUserDisplayName: string;
}) {
  const [selected, setSelected] = useState(initialSelected);

  const [undoError, setUndoError] = useAutoDismiss<string>(3000);
  const { current, notifyDeleted, undoCurrent } = useUndoableDelete(
    undoDeleteLeaveRequest,
    setUndoError,
  );

  return (
    <>
      <MonthCalendar
        monthLabel={monthLabel}
        prevMonthHref={prevMonthHref}
        nextMonthHref={nextMonthHref}
        days={days}
        entriesByDay={entriesByDay}
        selected={selected}
        onSelect={setSelected}
        leaveTypes={leaveTypes}
        onRequestDeleted={notifyDeleted}
        isAdmin={isAdmin}
        employeeNames={employeeNames}
        currentUserDisplayName={currentUserDisplayName}
      />
      <AddRequestSheet
        leaveTypes={leaveTypes}
        defaultDate={selected}
        isAdmin={isAdmin}
        employeeNames={employeeNames}
        currentUserDisplayName={currentUserDisplayName}
      />

      {current && (
        <div className="toast toast-undo">
          הבקשה של {current.employeeName} נמחקה
          <button type="button" onClick={undoCurrent}>
            בטל
          </button>
        </div>
      )}
      {undoError && <div className="toast toast-error">{undoError}</div>}
    </>
  );
}
