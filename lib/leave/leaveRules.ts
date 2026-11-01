import { isWeekend, toISODate } from "@/lib/utils/date";

// Pure leave-domain logic with no I/O — safe to import from Client
// Components (unlike leave.ts, which pulls in the Supabase server client).

export type LeaveType = {
  id: string;
  label_he: string;
  color_key: string;
  sort_order: number;
  weekend_applicable: boolean;
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
 * type(s)' label(s), or "נוכח" when they have none. Someone approved for two
 * different leave types the same day gets both labels (comma-joined) rather
 * than one silently overwriting the other. A name with an approved absence
 * but no matching roster entry (a removed/renamed profile) is still
 * appended, so a real recorded absence is never silently dropped. */
export function attendanceFromApprovedByType(
  leaveTypes: LeaveType[],
  byType: Map<string, LeaveRequest[]>,
  employeeNames: string[],
): AttendanceEntry[] {
  const labelsByName = new Map<string, string[]>();
  for (const lt of leaveTypes) {
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
