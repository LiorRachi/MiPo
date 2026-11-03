"use client";

import { useActionState, useState } from "react";
import {
  addLeaveType,
  deleteLeaveType,
  updateLeaveType,
  type LeaveTypeActionState,
} from "@/app/settings/actions";
import type { LeaveType } from "@/lib/leave/leave";
import { COLOR_LABELS_HE, LEAVE_TYPE_COLORS } from "@/lib/leave/leaveTypeColors";
import Sheet from "@/components/shared/Sheet";

const initialState: LeaveTypeActionState = {};

// A toggle switch instead of a plain checkbox for the sheet's two boolean
// fields — the native input stays for accessibility/form submission, just
// visually hidden under the styled track+thumb.
function SwitchField({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="switch-field">
      <span>{label}</span>
      <span className="switch">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} />
        <span className="switch-track">
          <span className="switch-thumb" />
        </span>
      </span>
    </label>
  );
}

// One sheet for both add and edit, repurposing the FAB request sheet's
// shell — mirrors RequestSheet's mode="add"|"edit" split so a row's whole
// edit surface (including delete) lives in one place instead of inline
// per-row forms.
const LeaveTypeSheetForm = ({
  mode,
  onClose,
  onSuccess,
  leaveType,
  nextSortOrder,
}: {
  mode: "add" | "edit";
  onClose: () => void;
  onSuccess?: () => void;
  leaveType?: LeaveType;
  nextSortOrder?: number;
}) => {
  const [color, setColor] = useState(leaveType?.color_key ?? LEAVE_TYPE_COLORS[0]);

  const [state, formAction, pending] = useActionState(
    async (prevState: LeaveTypeActionState, formData: FormData) => {
      const action = mode === "add" ? addLeaveType : updateLeaveType;
      const result = await action(prevState, formData);
      if (result.ok) onSuccess?.();
      return result;
    },
    initialState,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteLeaveType,
    initialState,
  );
  // Adjusting state during render (not in an effect) when deleteState
  // changes identity, per https://react.dev/learn/you-might-not-need-an-effect.
  const [prevDeleteState, setPrevDeleteState] = useState(deleteState);
  if (deleteState !== prevDeleteState) {
    setPrevDeleteState(deleteState);
    if (deleteState.ok) onClose();
  }

  const deleteFormId = `delete-leave-type-${leaveType?.id ?? "new"}`;

  return (
    <>
      <h3>{mode === "add" ? "הוספת סוג בקשת יציאה" : "עריכת סוג בקשת יציאה"}</h3>
      {state.error && <div className="form-error">{state.error}</div>}
      {deleteState.error && <div className="form-error">{deleteState.error}</div>}
      <form action={formAction}>
        {mode === "edit" && <input type="hidden" name="id" value={leaveType!.id} />}
        {mode === "add" && (
          <input type="hidden" name="sort_order" value={nextSortOrder ?? 0} />
        )}
        <input type="hidden" name="color_key" value={color} />
        <div className="field">
          <label htmlFor="lt-label-he">שם</label>
          <input
            id="lt-label-he"
            name="label_he"
            type="text"
            defaultValue={leaveType?.label_he}
            required
            autoFocus
          />
        </div>
        <div className="field">
          <label>צבע</label>
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
        </div>
        <SwitchField
          label='חל גם בסופ"ש (ו׳–ש׳)'
          name="weekend_applicable"
          defaultChecked={leaveType?.weekend_applicable ?? true}
        />
        <SwitchField
          label="נחשב יום יציאה מלא"
          name="full_day"
          defaultChecked={leaveType?.full_day ?? true}
        />
        <div className="sheet-actions">
          {mode === "edit" ? (
            <button
              type="submit"
              form={deleteFormId}
              className="btn danger"
              disabled={deletePending || pending}
            >
              מחיקה
            </button>
          ) : (
            <button type="button" className="btn ghost" onClick={onClose}>
              ביטול
            </button>
          )}
          <button type="submit" className="btn primary" disabled={pending || deletePending}>
            {pending ? "שומר..." : "שמירה"}
          </button>
        </div>
      </form>
      {mode === "edit" && (
        <form id={deleteFormId} action={deleteAction} hidden>
          <input type="hidden" name="id" value={leaveType!.id} />
        </form>
      )}
    </>
  );
};

export default function LeaveTypeSheet({
  mode,
  open,
  onClose,
  onSuccess,
  leaveType,
  nextSortOrder,
}: {
  mode: "add" | "edit";
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  leaveType?: LeaveType;
  nextSortOrder?: number;
}) {
  return (
    <Sheet open={open} onClose={onClose}>
      {open && (
        <LeaveTypeSheetForm
          mode={mode}
          onClose={onClose}
          onSuccess={onSuccess}
          leaveType={leaveType}
          nextSortOrder={nextSortOrder}
        />
      )}
    </Sheet>
  );
}
