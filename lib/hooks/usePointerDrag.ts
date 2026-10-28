"use client";

import { useRef, useState } from "react";

/** Single-axis pointer drag-to-threshold gesture: tracks an offset while the
 * pointer is down, clamped to [min, max], and calls `onCommit` on release
 * only if the final offset crossed `threshold` in magnitude — otherwise it
 * springs back to 0. `tapSlop`, if set, also distinguishes a real drag from
 * a tap/jitter and bails out of a gesture that's predominantly on the other
 * axis (e.g. a vertical list scroll during a horizontal swipe). Shared by
 * RequestRow's row-swipe and RequestSheet's dismiss-handle drag. */
export function usePointerDrag({
  axis,
  min,
  max,
  threshold,
  tapSlop,
  onCommit,
}: {
  axis: "x" | "y";
  min: number;
  max: number;
  threshold: number;
  tapSlop?: number;
  onCommit: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const draggingRef = useRef(false);
  // Exposed so callers can distinguish a tap from a drag in their own click
  // handler (e.g. for keyboard-activated clicks, which never touch this
  // hook's pointer handlers at all and so correctly read `false`).
  const movedRef = useRef(false);
  const startRef = useRef(0);
  const crossStartRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const offsetRef = useRef(0);

  function reset() {
    draggingRef.current = false;
    // Not movedRef: the browser fires a synthetic click right after
    // pointerup, and callers (e.g. RequestRow) read movedRef in that click
    // handler to tell a swipe from a tap. Clearing it here would always read
    // false by then. onPointerDown already resets it for the next gesture.
    pointerIdRef.current = null;
    offsetRef.current = 0;
    setOffset(0);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (draggingRef.current) return; // ignore a second concurrent touch
    draggingRef.current = true;
    movedRef.current = false;
    offsetRef.current = 0;
    startRef.current = axis === "x" ? e.clientX : e.clientY;
    crossStartRef.current = axis === "x" ? e.clientY : e.clientX;
    pointerIdRef.current = e.pointerId;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current || pointerIdRef.current !== e.pointerId) return;

    const pos = axis === "x" ? e.clientX : e.clientY;
    const cross = axis === "x" ? e.clientY : e.clientX;
    const delta = pos - startRef.current;
    const crossDelta = cross - crossStartRef.current;

    if (!movedRef.current) {
      if (tapSlop != null) {
        if (Math.abs(delta) < tapSlop && Math.abs(crossDelta) < tapSlop) {
          return;
        }
        if (Math.abs(crossDelta) > Math.abs(delta)) {
          // Predominantly on the other axis — e.g. a list scroll, not this
          // gesture. Full reset (not just draggingRef) so a second pointer
          // touching down mid-gesture can't inherit this one's pointerId.
          reset();
          return;
        }
      }
      movedRef.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Capture just keeps events flowing if the finger leaves the
        // element's bounds — if it's unavailable, keep tracking anyway.
      }
    }

    const clamped = Math.max(min, Math.min(max, delta));
    offsetRef.current = clamped;
    setOffset(clamped);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (pointerIdRef.current !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const finalOffset = offsetRef.current;
    reset();
    if (Math.abs(finalOffset) >= threshold) onCommit();
  }

  function onPointerCancel() {
    reset();
  }

  return {
    offset,
    movedRef,
    bind: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}
