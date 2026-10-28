"use client";

import { memo, useActionState, useState, useTransition } from "react";
import {
  addLeaveRequest,
  deleteLeaveRequest,
  updateLeaveRequest,
  type AddRequestState,
} from "@/app/actions";
import type { LeaveType } from "@/lib/leave";
import { toISODate } from "@/lib/date";
import { usePointerDrag } from "@/lib/hooks/usePointerDrag";
import RequestFormFields from "./RequestFormFields";

const initialState: AddRequestState = {};

// Sheet swipe-to-dismiss tuning: dragging the handle down past this snaps
// the sheet closed; short of it springs back open.
const SHEET_DISMISS_THRESHOLD = 90;

// All the per-open state (selected type, the add/update action's result,
// delete error) lives here. It resets for free because the parent only
// mounts this component while `open` is true (see the `{open && ...}` below)
// — keying just the <form> inside a stable RequestSheet wasn't enough, since
// these hooks are declared above the form and survived across opens; a full
// unmount/remount on every open/close does reset them, with no extra key.
const RequestSheetForm = memo(function RequestSheetForm({
  mode,
  onClose,
  onSuccess,
  onDeleted,
  leaveTypes,
  requestId,
  defaultEmployeeName,
  defaultDate,
  defaultReason,
  defaultLeaveTypeId,
  isAdmin,
  employeeNames,
  currentUserDisplayName,
}: {
  mode: "add" | "edit";
  onClose: () => void;
  onSuccess?: () => void;
  onDeleted?: () => void;
  leaveTypes: LeaveType[];
  requestId?: string;
  defaultEmployeeName?: string;
  defaultDate: string;
  defaultReason?: string | null;
  defaultLeaveTypeId?: string;
  isAdmin: boolean;
  employeeNames: string[];
  currentUserDisplayName: string;
}) {
  const [selectedType, setSelectedType] = useState(
    defaultLeaveTypeId ?? leaveTypes[0]?.id ?? "",
  );

  const [state, formAction, pending] = useActionState(
    async (prevState: AddRequestState, formData: FormData) => {
      const action = mode === "add" ? addLeaveRequest : updateLeaveRequest;
      const result = await action(prevState, formData);
      if (result.ok) onSuccess?.();
      return result;
    },
    initialState,
  );

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete() {
    if (!requestId) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteLeaveRequest(requestId);
      if (result.error) setDeleteError(result.error);
      else onDeleted?.();
    });
  }

  return (
    <>
      <h3>{mode === "add" ? "בקשת יציאה חדשה" : "עריכת בקשת יציאה"}</h3>
      {state.error && <div className="form-error">{state.error}</div>}
      {deleteError && <div className="form-error">{deleteError}</div>}
      <form action={formAction}>
        {mode === "edit" && <input type="hidden" name="id" value={requestId} />}
        <input type="hidden" name="leave_type_id" value={selectedType} />
        <RequestFormFields
          leaveTypes={leaveTypes}
          selectedType={selectedType}
          onSelectType={setSelectedType}
          defaultEmployeeName={defaultEmployeeName}
          defaultDate={defaultDate}
          defaultReason={defaultReason}
          isAdmin={isAdmin}
          employeeNames={employeeNames}
          currentUserDisplayName={currentUserDisplayName}
        />
        <div className="sheet-actions">
          {mode === "edit" ? (
            <button
              type="button"
              className="btn danger"
              onClick={handleDelete}
              disabled={isDeleting || pending}
            >
              מחיקה
            </button>
          ) : (
            <button type="button" className="btn ghost" onClick={onClose}>
              ביטול
            </button>
          )}
          <button
            type="submit"
            className="btn primary"
            disabled={pending || isDeleting}
          >
            {pending ? "שומר..." : "שמירה"}
          </button>
        </div>
      </form>
    </>
  );
});

export default function RequestSheet({
  mode,
  open,
  onClose,
  onSuccess,
  onDeleted,
  leaveTypes,
  requestId,
  defaultEmployeeName,
  defaultDate,
  defaultReason,
  defaultLeaveTypeId,
  isAdmin,
  employeeNames,
  currentUserDisplayName,
}: {
  mode: "add" | "edit";
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onDeleted?: () => void;
  leaveTypes: LeaveType[];
  requestId?: string;
  defaultEmployeeName?: string;
  defaultDate?: string;
  defaultReason?: string | null;
  defaultLeaveTypeId?: string;
  isAdmin: boolean;
  employeeNames: string[];
  currentUserDisplayName: string;
}) {
  const date = defaultDate ?? toISODate(new Date());

  const { offset: sheetDragY, bind: sheetHandleBind } = usePointerDrag({
    axis: "y",
    min: 0,
    max: Infinity,
    threshold: SHEET_DISMISS_THRESHOLD,
    onCommit: onClose,
  });
  const sheetDragging = sheetDragY !== 0;

  return (
    <div
      className={`sheet-backdrop${open ? " show" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="sheet"
        style={
          sheetDragging
            ? { transform: `translateY(${sheetDragY}px)`, transition: "none" }
            : undefined
        }
      >
        <div className="sheet-handle" {...sheetHandleBind} />
        {open && (
          <RequestSheetForm
            mode={mode}
            onClose={onClose}
            onSuccess={onSuccess}
            onDeleted={onDeleted}
            leaveTypes={leaveTypes}
            requestId={requestId}
            defaultEmployeeName={defaultEmployeeName}
            defaultDate={date}
            defaultReason={defaultReason}
            defaultLeaveTypeId={defaultLeaveTypeId}
            isAdmin={isAdmin}
            employeeNames={employeeNames}
            currentUserDisplayName={currentUserDisplayName}
          />
        )}
      </div>
    </div>
  );
}
