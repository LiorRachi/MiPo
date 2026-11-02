"use client";

import { useState, useTransition } from "react";
import { setLeaveRequestStatus } from "@/app/actions";
import type { LeaveRequestStatus, LeaveType } from "@/lib/leave/leave";
import type { DayEntry } from "@/components/calendar/MonthCalendar";
import { formatDateRangeShortHe, formatFullDateHe, parseISODate } from "@/lib/utils/date";
import { usePointerDrag } from "@/lib/hooks/usePointerDrag";
import RequestSheet from "./RequestSheet";

const STATUS_ICON: Record<"approved" | "denied", string> = {
  approved: "✓",
  denied: "✕",
};

// Swipe-to-edit tuning: dragging a row left or right reveals edit behind it;
// releasing past SWIPE_THRESHOLD opens the edit sheet (releasing short of it
// snaps back, no action). TAP_SLOP just distinguishes a real swipe from a tap.
const SWIPE_THRESHOLD = 72;
const MAX_DRAG = 112;
const TAP_SLOP = 8;

const EDIT_ICON_PATH = "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z";

function SwipeEditIndicator({
  side,
  progress,
}: {
  side: "start" | "end";
  progress: number;
}) {
  const icon = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={EDIT_ICON_PATH} />
    </svg>
  );
  return (
    <div
      className="req-row-swipe-action edit"
      style={{
        opacity: Math.min(1, progress),
        ...(side === "end" ? { marginInlineStart: "auto" } : {}),
      }}
    >
      {side === "start" ? (
        <>
          עריכה
          {icon}
        </>
      ) : (
        <>
          {icon}
          עריכה
        </>
      )}
    </div>
  );
}

export default function RequestRow({
  entry: {
    id,
    employeeName,
    labelHe,
    colorKey,
    reason,
    status: initialStatus,
    leaveTypeId,
    date,
    endDate,
    decidedByName,
    decidedAt,
  },
  leaveTypes,
  onDeleted,
  isAdmin,
  employeeNames,
  currentUserDisplayName,
}: {
  entry: DayEntry;
  leaveTypes: LeaveType[];
  onDeleted?: (id: string, employeeName: string) => void;
  isAdmin: boolean;
  employeeNames: string[];
  currentUserDisplayName: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [editOpen, setEditOpen] = useState(false);

  // Clicking an already-active button clears it back to pending (undo),
  // rather than being a one-way approve/deny switch. Optimistic update is
  // rolled back and surfaced as an error if the write fails; isPending
  // disables both buttons so a second click can't race the first.
  function toggleStatus(next: LeaveRequestStatus) {
    const previous = status;
    const resolved = status === next ? "pending" : next;
    setStatus(resolved);
    setError(null);
    startTransition(async () => {
      const result = await setLeaveRequestStatus(id, resolved);
      if (result.error) {
        setStatus(previous);
        setError(result.error);
      } else {
        setExpanded(false);
      }
    });
  }

  function openEdit() {
    setEditOpen(true);
  }

  const {
    offset: dragX,
    movedRef,
    bind,
  } = usePointerDrag({
    axis: "x",
    min: -MAX_DRAG,
    max: MAX_DRAG,
    threshold: SWIPE_THRESHOLD,
    tapSlop: TAP_SLOP,
    onCommit: openEdit,
  });

  return (
    <div className="req-row">
      <div className="req-row-swipe-area">
        <div className="req-row-swipe-bg">
          <SwipeEditIndicator
            side="start"
            progress={Math.max(0, -dragX) / SWIPE_THRESHOLD}
          />
          <SwipeEditIndicator
            side="end"
            progress={Math.max(0, dragX) / SWIPE_THRESHOLD}
          />
        </div>
        <button
          type="button"
          className="req-row-top"
          style={{ transform: `translateX(${dragX}px)` }}
          {...bind}
          onClick={() => {
            if (!movedRef.current) setExpanded((e) => !e);
          }}
          aria-expanded={expanded}
        >
          <div className="who">
            <span className={`dot ${colorKey}`} />
            {employeeName}
            {date !== endDate &&
              (() => {
                const start = parseISODate(date);
                const end = parseISODate(endDate);
                return start && end ? (
                  <span className="req-row-range">{formatDateRangeShortHe(start, end)}</span>
                ) : null;
              })()}
          </div>
          <div className="req-row-meta">
            {status !== "pending" && (
              <span
                className={`status-indicator ${status}`}
                aria-label={status === "approved" ? "אושר" : "נדחה"}
              >
                {STATUS_ICON[status]}
              </span>
            )}
            <span className={`type-tag ${colorKey}`}>{labelHe}</span>
          </div>
        </button>
      </div>

      {expanded && (reason || isAdmin || (status !== "pending" && decidedByName)) && (
        <div className="req-row-expand">
          {reason && <div className="req-reason">{reason}</div>}
          {status !== "pending" && decidedByName && (
            <div className="req-decided-by">
              {status === "approved" ? "אושר" : "נדחה"} על ידי {decidedByName}
              {decidedAt && ` · ${formatFullDateHe(new Date(decidedAt))}`}
            </div>
          )}
          {error && <div className="form-error">{error}</div>}
          {isAdmin && (
            <div className="req-row-actions">
              <button
                type="button"
                className={`status-btn approve${status === "approved" ? " active" : ""}`}
                onClick={() => toggleStatus("approved")}
                aria-pressed={status === "approved"}
                disabled={isPending}
              >
                ✓ אישור
              </button>
              <button
                type="button"
                className={`status-btn deny${status === "denied" ? " active" : ""}`}
                onClick={() => toggleStatus("denied")}
                aria-pressed={status === "denied"}
                disabled={isPending}
              >
                ✕ דחייה
              </button>
            </div>
          )}
        </div>
      )}

      <RequestSheet
        mode="edit"
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => setEditOpen(false)}
        onDeleted={() => {
          setEditOpen(false);
          onDeleted?.(id, employeeName);
        }}
        leaveTypes={leaveTypes}
        requestId={id}
        defaultEmployeeName={employeeName}
        defaultDate={date}
        defaultEndDate={endDate}
        defaultReason={reason}
        defaultLeaveTypeId={leaveTypeId}
        isAdmin={isAdmin}
        employeeNames={employeeNames}
        currentUserDisplayName={currentUserDisplayName}
      />
    </div>
  );
}
