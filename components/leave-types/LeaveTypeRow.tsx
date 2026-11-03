"use client";

import { useState } from "react";
import type { LeaveType } from "@/lib/leave/leave";
import LeaveTypeSheet from "./LeaveTypeSheet";

export default function LeaveTypeRow({
  leaveType,
  onHandlePointerDown,
  onHandlePointerMove,
  onHandlePointerUp,
}: {
  leaveType: LeaveType;
  onHandlePointerDown?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onHandlePointerMove?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onHandlePointerUp?: (e: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="settings-row-item">
      <button
        type="button"
        className="drag-handle"
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
        aria-label="גרירה לשינוי סדר"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.6" />
          <circle cx="15" cy="6" r="1.6" />
          <circle cx="9" cy="12" r="1.6" />
          <circle cx="15" cy="12" r="1.6" />
          <circle cx="9" cy="18" r="1.6" />
          <circle cx="15" cy="18" r="1.6" />
        </svg>
      </button>

      <button
        type="button"
        className="settings-row settings-nav-row"
        style={{
          borderColor: `var(--leave-${leaveType.color_key})`,
          backgroundColor: `var(--leave-${leaveType.color_key}-bg)`,
        }}
        onClick={() => setEditOpen(true)}
      >
        <span
          className="settings-nav-label"
          style={{ color: `var(--leave-${leaveType.color_key})` }}
        >
          {leaveType.label_he}
        </span>
        <span className="settings-nav-chevron">›</span>
      </button>

      <LeaveTypeSheet
        mode="edit"
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => setEditOpen(false)}
        leaveType={leaveType}
      />
    </div>
  );
}
