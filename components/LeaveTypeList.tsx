"use client";

import { useEffect, useRef, useState } from "react";
import { reorderLeaveTypes } from "@/app/settings/actions";
import type { LeaveType } from "@/lib/leave";
import LeaveTypeRow from "./LeaveTypeRow";

export default function LeaveTypeList({
  leaveTypes,
}: {
  leaveTypes: LeaveType[];
}) {
  const [items, setItems] = useState(leaveTypes);
  const [activeId, setActiveId] = useState<string | null>(null);
  const draggingId = useRef<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  function finishDrag() {
    if (!draggingId.current) return;
    draggingId.current = null;
    setActiveId(null);
    reorderLeaveTypes(items.map((it) => it.id));
  }

  // Safety net: if the handle's own pointerup/pointercancel is ever missed
  // (observed with some synthetic/automated input, and cheap insurance for
  // real touch input too), a pointerup/cancel anywhere still ends the drag
  // instead of leaving it stuck. Re-subscribes with a fresh closure whenever
  // `items` changes so it always reorders the current list.
  useEffect(() => {
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    return () => {
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    };
  });

  function handlePointerDown(
    id: string,
    e: React.PointerEvent<HTMLButtonElement>,
  ) {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Capture just keeps events flowing if the finger leaves the
      // handle's bounds — if it's unavailable, keep tracking anyway
      // (matches the same defensive handling in lib/hooks/usePointerDrag.ts).
    }
    draggingId.current = id;
    setActiveId(id);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!draggingId.current) return;
    const y = e.clientY;
    const currentIndex = items.findIndex((it) => it.id === draggingId.current);
    if (currentIndex === -1) return;

    for (let i = 0; i < items.length; i++) {
      if (i === currentIndex) continue;
      const el = rowRefs.current.get(items[i].id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const crossedForward = i > currentIndex && y > mid;
      const crossedBackward = i < currentIndex && y < mid;
      if (crossedForward || crossedBackward) {
        setItems((prev) => {
          const next = [...prev];
          const [moved] = next.splice(currentIndex, 1);
          next.splice(i, 0, moved);
          return next;
        });
        break;
      }
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    finishDrag();
  }

  return (
    <div className="settings-list">
      {items.map((lt) => (
        <div
          key={lt.id}
          ref={(el) => {
            if (el) rowRefs.current.set(lt.id, el);
            else rowRefs.current.delete(lt.id);
          }}
          className={activeId === lt.id ? "dragging" : ""}
        >
          <LeaveTypeRow
            leaveType={lt}
            onHandlePointerDown={(e) => handlePointerDown(lt.id, e)}
            onHandlePointerMove={handlePointerMove}
            onHandlePointerUp={handlePointerUp}
          />
        </div>
      ))}
    </div>
  );
}
