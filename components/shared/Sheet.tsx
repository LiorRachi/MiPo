"use client";

import { usePointerDrag } from "@/lib/hooks/usePointerDrag";

// Sheet swipe-to-dismiss tuning: dragging the handle down past this snaps
// the sheet closed; short of it springs back open.
const SHEET_DISMISS_THRESHOLD = 90;

// The bottom-sheet shell (backdrop, drag handle, swipe-to-dismiss) shared by
// every "+"-triggered or row-triggered edit sheet in the app — originally
// RequestSheet's own markup, extracted once a second and third sheet
// (leave types, users) needed the same backdrop/drag behavior.
export default function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
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
        {children}
      </div>
    </div>
  );
}
