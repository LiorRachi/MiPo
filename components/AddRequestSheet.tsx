"use client";

import { useState } from "react";
import type { LeaveType } from "@/lib/leave";
import { useAutoDismiss } from "@/lib/hooks/useAutoDismiss";
import RequestSheet from "./RequestSheet";

export default function AddRequestSheet({
  leaveTypes,
  defaultDate,
}: {
  leaveTypes: LeaveType[];
  defaultDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useAutoDismiss<string>(1800);

  function handleSuccess() {
    setOpen(false);
    setToast("נשמר בהצלחה ✓");
  }

  if (leaveTypes.length === 0) return null;

  return (
    <>
      <button
        className="fab"
        onClick={() => setOpen(true)}
        aria-label="הוספת בקשת חופשה"
      >
        +
      </button>

      {toast && <div className="toast">{toast}</div>}

      <RequestSheet
        mode="add"
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        leaveTypes={leaveTypes}
        defaultDate={defaultDate}
      />
    </>
  );
}
