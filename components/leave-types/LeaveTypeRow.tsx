"use client";

import { useActionState, useState } from "react";
import {
  deleteLeaveType,
  updateLeaveType,
  type LeaveTypeActionState,
} from "@/app/settings/actions";
import type { LeaveType } from "@/lib/leave/leave";
import { COLOR_LABELS_HE, LEAVE_TYPE_COLORS } from "@/lib/leave/leaveTypeColors";
import { DeleteRowButton, SaveRowButton } from "@/components/shared/RowActionButtons";

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
          <label className="checkbox-field">
            <input
              type="checkbox"
              name="weekend_applicable"
              defaultChecked={leaveType.weekend_applicable}
            />
            חל גם בסופ&quot;ש (ו׳–ש׳)
          </label>
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
              <SaveRowButton disabled={updatePending} />
              <DeleteRowButton
                form={`delete-${leaveType.id}`}
                disabled={deletePending}
              />
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
