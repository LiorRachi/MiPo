"use client";

import { useState, useTransition } from "react";
import { setLeaveRequestStatus } from "@/app/actions";
import type { LeaveRequestStatus } from "@/lib/leave";

const STATUS_ICON: Record<"approved" | "denied", string> = {
  approved: "✓",
  denied: "✕",
};

export default function RequestRow({
  id,
  employeeName,
  labelHe,
  colorKey,
  reason,
  status: initialStatus,
}: {
  id: string;
  employeeName: string;
  labelHe: string;
  colorKey: string;
  reason: string | null;
  status: LeaveRequestStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="req-row">
      <button
        type="button"
        className="req-row-top"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <div className="who">
          <span className={`dot ${colorKey}`} />
          {employeeName}
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

      {expanded && (
        <div className="req-row-expand">
          {reason && <div className="req-reason">{reason}</div>}
          {error && <div className="form-error">{error}</div>}
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
        </div>
      )}
    </div>
  );
}
