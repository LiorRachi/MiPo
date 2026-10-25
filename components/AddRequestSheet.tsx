"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addLeaveRequest, type AddRequestState } from "@/app/actions";
import type { LeaveType } from "@/lib/leave";
import { toISODate } from "@/lib/date";

const initialState: AddRequestState = {};

function RequestForm({
  leaveTypes,
  onSuccess,
  onCancel,
}: {
  leaveTypes: LeaveType[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [selectedType, setSelectedType] = useState(leaveTypes[0]?.id ?? "");
  const today = toISODate(new Date());

  // Runs as part of the form-action dispatch (not an effect), so updating
  // sibling state here (closing the sheet, showing a toast) is safe.
  const [state, formAction, pending] = useActionState(
    async (prevState: AddRequestState, formData: FormData) => {
      const result = await addLeaveRequest(prevState, formData);
      if (result.ok) onSuccess();
      return result;
    },
    initialState,
  );

  return (
    <>
      <h3>בקשת חופשה חדשה</h3>
      {state.error && <div className="form-error">{state.error}</div>}
      <form action={formAction}>
        <input type="hidden" name="leave_type_id" value={selectedType} />
        <div className="field">
          <label htmlFor="employee_name">עובד/ת</label>
          <input
            id="employee_name"
            name="employee_name"
            type="text"
            placeholder="שם העובד/ת"
            required
          />
        </div>
        <div className="field">
          <label>סוג חופשה</label>
          <div className="type-pick">
            {leaveTypes.map((lt) => (
              <button
                type="button"
                key={lt.id}
                className={`${lt.color_key}${selectedType === lt.id ? " sel" : ""}`}
                onClick={() => setSelectedType(lt.id)}
              >
                {lt.label_he}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="start_date">מתאריך</label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={today}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="end_date">עד תאריך</label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={today}
            required
          />
        </div>
        <div className="sheet-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            ביטול
          </button>
          <button type="submit" className="btn primary" disabled={pending}>
            {pending ? "שומר..." : "שמירה"}
          </button>
        </div>
      </form>
    </>
  );
}

export default function AddRequestSheet({
  leaveTypes,
}: {
  leaveTypes: LeaveType[];
}) {
  const [open, setOpen] = useState(false);
  // Bumped on every open so <RequestForm> remounts with a clean
  // useActionState — clears any stale error from a prior cancelled/failed
  // attempt instead of carrying it into the next session.
  const [sheetKey, setSheetKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function handleSuccess() {
    setOpen(false);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast("נשמר בהצלחה ✓");
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }

  if (leaveTypes.length === 0) return null;

  return (
    <>
      <button
        className="fab"
        onClick={() => {
          setSheetKey((k) => k + 1);
          setOpen(true);
        }}
        aria-label="הוספת בקשת חופשה"
      >
        +
      </button>

      {toast && <div className="toast">{toast}</div>}

      <div
        className={`sheet-backdrop${open ? " show" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        <div className="sheet">
          <RequestForm
            key={sheetKey}
            leaveTypes={leaveTypes}
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
          />
        </div>
      </div>
    </>
  );
}
