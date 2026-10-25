const HEBREW_WEEKDAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const HEBREW_MONTHS = [
  "בינואר",
  "בפברואר",
  "במרץ",
  "באפריל",
  "במאי",
  "ביוני",
  "ביולי",
  "באוגוסט",
  "בספטמבר",
  "באוקטובר",
  "בנובמבר",
  "בדצמבר",
];
const HEBREW_MONTHS_PLAIN = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parses a strict `YYYY-MM-DD` string. Returns null for anything malformed
 * instead of producing an Invalid Date, so callers can fall back safely. */
export function parseISODate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  // Reject e.g. 2026-02-31, which Date would otherwise silently roll into March.
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  return date;
}

/** Today's calendar date in Israel, independent of the server process's own
 * timezone (which may be UTC or anything else depending on where it runs). */
export function todayInIsrael(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return new Date(get("year"), get("month") - 1, get("day"));
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

/** Sunday of the week containing `d` (Hebrew-calendar week start). */
export function weekStart(d: Date): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - copy.getDay());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function weekDays(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function hebrewWeekdayLetter(d: Date): string {
  return HEBREW_WEEKDAYS[d.getDay()];
}

/** Israeli weekend: Friday (5) and Saturday (6). */
export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 5 || day === 6;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b);
}

export function formatWeekRangeHe(start: Date, end: Date): string {
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}–${end.getDate()} ${HEBREW_MONTHS[start.getMonth()]}`;
  }
  return `${start.getDate()} ${HEBREW_MONTHS[start.getMonth()]} – ${end.getDate()} ${HEBREW_MONTHS[end.getMonth()]}`;
}

export function formatFullDateHe(d: Date): string {
  return `${d.getDate()} ${HEBREW_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function monthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Adds `n` months to the 1st of `d`'s month (avoids day-of-month overflow —
 * always normalize to monthStart first if `d` isn't already day 1). */
export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/** Every day shown on a month-grid calendar for the month containing `month`:
 * full weeks (Sun–Sat) covering the 1st through the last day of the month,
 * including the leading/trailing days from adjacent months needed to
 * complete those weeks. */
export function monthGrid(month: Date): Date[] {
  const start = monthStart(month);
  const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  const gridStart = weekStart(start);
  const gridEnd = addDays(weekStart(lastDay), 6);

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    days.push(d);
  }
  return days;
}

export function toISOMonth(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Parses a strict `YYYY-MM` string into the 1st of that month. Returns null
 * for anything malformed. */
export function parseISOMonth(s: string): Date | null {
  if (!/^\d{4}-\d{2}$/.test(s)) return null;
  const [y, m] = s.split("-").map(Number);
  if (m < 1 || m > 12) return null;
  return new Date(y, m - 1, 1);
}

export function formatMonthHe(d: Date): string {
  return `${HEBREW_MONTHS_PLAIN[d.getMonth()]} ${d.getFullYear()}`;
}

/** e.g. "יום א׳, 25/10", or "שבת, 31/10" for Saturdays. */
export function formatDayLabelHe(d: Date): string {
  const dm = `${d.getDate()}/${d.getMonth() + 1}`;
  if (d.getDay() === 6) return `שבת, ${dm}`;
  return `יום ${hebrewWeekdayLetter(d)}׳, ${dm}`;
}
