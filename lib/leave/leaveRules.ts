import { addDays, isWeekend, toISODate } from "@/lib/utils/date";

// Pure leave-domain logic with no I/O — safe to import from Client
// Components (unlike leave.ts, which pulls in the Supabase server client).

export type LeaveType = {
  id: string;
  label_he: string;
  color_key: string;
  sort_order: number;
  weekend_applicable: boolean;
  // False for a type approved like any other but that isn't a whole-day
  // absence (e.g. יציאה מוקדמת, הגעה מאוחרת) — not yet consumed by any
  // calculation here; it exists for callers that need to tell the two apart.
  full_day: boolean;
};

export type LeaveRequestStatus = "pending" | "approved" | "denied";

export type LeaveRequest = {
  id: string;
  employee_name: string;
  profile_id: string | null;
  leave_type_id: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  reason: string | null;
  status: LeaveRequestStatus;
  decided_by_name: string | null;
  decided_at: string | null; // ISO timestamp
};

/** Whether a request of this leave type should be shown/counted on `day` —
 * false only for a type that opts out of weekends (weekend_applicable=false)
 * on a Friday/Saturday. Shared by the week-grid and the requests calendar so
 * the rule can't drift between the two screens. */
export function isVisibleOnDay(leaveType: LeaveType, day: Date): boolean {
  return leaveType.weekend_applicable || !isWeekend(day);
}

/** Whether `request` is an approved request of `leaveType` that covers
 * `day` — the single predicate behind both the week-grid's cells and the
 * attendance-copy list, so the two can't drift on what counts as "out". */
export function isApprovedOnDay(
  request: LeaveRequest,
  leaveType: LeaveType,
  day: Date,
): boolean {
  if (request.leave_type_id !== leaveType.id || request.status !== "approved") {
    return false;
  }
  if (!isVisibleOnDay(leaveType, day)) return false;
  const iso = toISODate(day);
  return request.start_date <= iso && request.end_date >= iso;
}

/** True if `leaveType` doesn't apply (per isVisibleOnDay) on the range's
 * start or end day — the two boundaries a request actually commits to. A
 * hidden day *inside* the range (e.g. a weekend crossed by a longer request)
 * is fine and simply isn't shown/counted on the grid, matching how a
 * multi-day request already renders; but a start or end boundary that's
 * itself hidden has no visible effect (extending a weekend-inapplicable
 * type's end date onto a Friday changes nothing shown) and just stores a
 * misleading range, so it's blocked outright. */
export function isRangeBoundaryHidden(
  leaveType: LeaveType,
  start: Date,
  end: Date,
): boolean {
  return !isVisibleOnDay(leaveType, start) || !isVisibleOnDay(leaveType, end);
}

export type AttendanceEntry = { employeeName: string; labelHe: string };

const PRESENT_LABEL_HE = "נוכח";

/** Approved requests for `day`, grouped by leave type id — the one pass over
 * leaveTypes × requests that both the week-grid's cells and the
 * attendance-copy list need. Computed once per day and shared between the
 * two, instead of each redoing its own full pass. */
export function approvedRequestsByTypeForDay(
  leaveTypes: LeaveType[],
  requests: LeaveRequest[],
  day: Date,
): Map<string, LeaveRequest[]> {
  const byType = new Map<string, LeaveRequest[]>();
  for (const lt of leaveTypes) {
    byType.set(lt.id, requests.filter((r) => isApprovedOnDay(r, lt, day)));
  }
  return byType;
}

/** The whole roster's status for a day, for the copy-to-clipboard attendance
 * list: each name in `employeeNames` paired with their approved leave
 * type(s)' label(s), or "נוכח" when they have none. A type with
 * full_day=false (יציאה מוקדמת, הגעה מאוחרת, ...) is skipped here — someone
 * approved only for one of those is still counted as present for the day,
 * even though the week-grid cell (approvedRequestsByTypeForDay, unaffected
 * by this) still shows it. Someone approved for two different full-day
 * types the same day gets both labels (comma-joined) rather than one
 * silently overwriting the other. A name with an approved absence but no
 * matching roster entry (a removed/renamed profile) is still appended, so a
 * real recorded absence is never silently dropped. */
export function attendanceFromApprovedByType(
  leaveTypes: LeaveType[],
  byType: Map<string, LeaveRequest[]>,
  employeeNames: string[],
): AttendanceEntry[] {
  const labelsByName = new Map<string, string[]>();
  for (const lt of leaveTypes) {
    if (!lt.full_day) continue;
    for (const r of byType.get(lt.id) ?? []) {
      const labels = labelsByName.get(r.employee_name) ?? [];
      if (!labels.includes(lt.label_he)) labels.push(lt.label_he);
      labelsByName.set(r.employee_name, labels);
    }
  }
  const labelFor = (name: string) =>
    labelsByName.get(name)?.join(", ") ?? PRESENT_LABEL_HE;
  const entries: AttendanceEntry[] = employeeNames.map((employeeName) => ({
    employeeName,
    labelHe: labelFor(employeeName),
  }));
  for (const employeeName of labelsByName.keys()) {
    if (!employeeNames.includes(employeeName)) {
      entries.push({ employeeName, labelHe: labelFor(employeeName) });
    }
  }
  return entries;
}

export function attendanceForDay(
  leaveTypes: LeaveType[],
  requests: LeaveRequest[],
  employeeNames: string[],
  day: Date,
): AttendanceEntry[] {
  return attendanceFromApprovedByType(
    leaveTypes,
    approvedRequestsByTypeForDay(leaveTypes, requests, day),
    employeeNames,
  );
}

export function formatAttendanceList(entries: AttendanceEntry[]): string {
  return entries.map((e) => `${e.employeeName} - ${e.labelHe}`).join("\n");
}

/** Approved days of each leave type within [start, end] (inclusive), for the
 * given requests — built on the same isApprovedOnDay predicate the
 * week-grid uses for a single day, summed across the range so the two can't
 * drift on what counts as an approved day. Keyed by leave type id; every
 * type in `leaveTypes` is present even at 0. */
export function approvedDayCountsByType(
  leaveTypes: LeaveType[],
  requests: LeaveRequest[],
  start: Date,
  end: Date,
): Map<string, number> {
  const counts = new Map<string, number>(leaveTypes.map((lt) => [lt.id, 0]));
  for (let d = start; d <= end; d = addDays(d, 1)) {
    for (const lt of leaveTypes) {
      if (requests.some((r) => isApprovedOnDay(r, lt, d))) {
        counts.set(lt.id, (counts.get(lt.id) ?? 0) + 1);
      }
    }
  }
  return counts;
}
