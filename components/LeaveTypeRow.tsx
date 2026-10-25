"use client";

import { useActionState, useState } from "react";
import {
  deleteLeaveType,
  updateLeaveType,
  type LeaveTypeActionState,
} from "@/app/settings/actions";
import type { LeaveType } from "@/lib/leave";
import { COLOR_LABELS_HE, LEAVE_TYPE_COLORS } from "@/lib/leaveTypeColors";

const initialState: LeaveTypeActionState = {};

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
  const [color, setColor] = useState(leaveType.color_key);
  const [updateState, updateAction, updatePending] = useActionState(
    updateLeaveType,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteLeaveType,
    initialState,
  );

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

      <div className="settings-row">
        <form action={updateAction} className="settings-row-form">
          <input type="hidden" name="id" value={leaveType.id} />
          <input type="hidden" name="color_key" value={color} />
          <input
            type="text"
            name="label_he"
            defaultValue={leaveType.label_he}
            className="settings-label-input"
            aria-label="שם סוג החופשה"
          />
          <div className="settings-row-bottom">
            <div className="color-pick">
              {LEAVE_TYPE_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`swatch${color === c ? " sel" : ""}`}
                  style={{ background: `var(--leave-${c})` }}
                  onClick={() => setColor(c)}
                  aria-label={COLOR_LABELS_HE[c]}
                  aria-pressed={color === c}
                />
              ))}
            </div>
            <div className="settings-row-actions">
              <button
                type="submit"
                className="btn ghost icon"
                disabled={updatePending}
                aria-label="שמירה"
                title="שמירה"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <button
                type="submit"
                form={`delete-${leaveType.id}`}
                className="btn danger icon"
                disabled={deletePending}
                aria-label="מחיקה"
                title="מחיקה"
              >
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
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </div>
          </div>
        </form>
        <form id={`delete-${leaveType.id}`} action={deleteAction} hidden>
          <input type="hidden" name="id" value={leaveType.id} />
        </form>
        {updateState.error && (
          <div className="form-error">{updateState.error}</div>
        )}
        {deleteState.error && (
          <div className="form-error">{deleteState.error}</div>
        )}
      </div>
    </div>
  );
}
