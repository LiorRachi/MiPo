"use client";

import { useActionState, useRef, useState } from "react";
import {
  addLeaveType,
  type LeaveTypeActionState,
} from "@/app/settings/actions";
import { COLOR_LABELS_HE, LEAVE_TYPE_COLORS } from "@/lib/leaveTypeColors";

const initialState: LeaveTypeActionState = {};

export default function AddLeaveTypeForm({
  nextSortOrder,
}: {
  nextSortOrder: number;
}) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState<string>(LEAVE_TYPE_COLORS[0]);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (prevState: LeaveTypeActionState, formData: FormData) => {
      const result = await addLeaveType(prevState, formData);
      if (result.ok) {
        formRef.current?.reset();
        setColor(LEAVE_TYPE_COLORS[0]);
        setOpen(false);
      }
      return result;
    },
    initialState,
  );

  if (!open) {
    return (
      <button
        type="button"
        className="settings-add-toggle"
        onClick={() => setOpen(true)}
      >
        <span className="plus">+</span> הוספת סוג חופשה
      </button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="settings-add-form">
      <div className="settings-add-form-head">
        <h3>הוספת סוג חופשה</h3>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setOpen(false)}
          aria-label="סגירה"
        >
          ✕
        </button>
      </div>
      {state.error && <div className="form-error">{state.error}</div>}
      <input type="hidden" name="color_key" value={color} />
      <input type="hidden" name="sort_order" value={nextSortOrder} />
      <div className="field">
        <label htmlFor="new-label-he">שם</label>
        <input id="new-label-he" name="label_he" type="text" required autoFocus />
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
      <label className="checkbox-field">
        <input type="checkbox" name="weekend_applicable" defaultChecked />
        חל גם בסופ&quot;ש (ו׳–ש׳)
      </label>
      <button type="submit" className="btn primary" disabled={pending}>
        {pending ? "מוסיף..." : "הוספה"}
      </button>
    </form>
  );
}
