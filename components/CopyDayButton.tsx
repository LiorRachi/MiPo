"use client";

import { useAutoDismiss } from "@/lib/hooks/useAutoDismiss";

export default function CopyDayButton({
  dayNumber,
  isToday,
  attendanceText,
  ariaLabel,
}: {
  dayNumber: number;
  isToday: boolean;
  attendanceText: string;
  ariaLabel: string;
}) {
  const [toast, setToast] = useAutoDismiss<string>(1800);

  async function handleClick() {
    if (!attendanceText) return;
    try {
      await navigator.clipboard.writeText(attendanceText);
      setToast("רשימת נוכחות הועתקה!");
    } catch {
      // Clipboard permission denied/unavailable — nothing copied, so no feedback either.
    }
  }

  return (
    <>
      <button
        type="button"
        className={`dn${isToday ? " today" : ""}`}
        onClick={handleClick}
        disabled={!attendanceText}
        aria-label={ariaLabel}
      >
        {dayNumber}
      </button>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
