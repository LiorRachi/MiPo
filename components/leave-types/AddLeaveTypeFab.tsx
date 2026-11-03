"use client";

import { useState } from "react";
import LeaveTypeSheet from "./LeaveTypeSheet";

export default function AddLeaveTypeFab({ nextSortOrder }: { nextSortOrder: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="fab" onClick={() => setOpen(true)} aria-label="הוספת סוג בקשת יציאה">
        +
      </button>

      <LeaveTypeSheet
        mode="add"
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => setOpen(false)}
        nextSortOrder={nextSortOrder}
      />
    </>
  );
}
