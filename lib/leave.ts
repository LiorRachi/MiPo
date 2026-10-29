import type { CurrentUser } from "./auth";
import { isWeekend, toISODate } from "./date";
import { createClient } from "./supabase/server";
import { fetchAllUsers } from "./users";

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

/** The whole roster's status on `day`, for the copy-to-clipboard attendance
 * list: each name in `employeeNames` paired with their approved leave type's
 * label, or "נוכח" when they have none. A name with an approved absence but
 * no matching roster entry (a removed/renamed profile) is still appended, so
 * a real recorded absence is never silently dropped. */
export function attendanceForDay(
  leaveTypes: LeaveType[],
  requests: LeaveRequest[],
  employeeNames: string[],
  day: Date,
): AttendanceEntry[] {
  const absentByName = new Map<string, string>();
  for (const lt of leaveTypes) {
    for (const r of requests) {
      if (isApprovedOnDay(r, lt, day)) {
        absentByName.set(r.employee_name, lt.label_he);
      }
    }
  }
  const entries: AttendanceEntry[] = employeeNames.map((employeeName) => ({
    employeeName,
    labelHe: absentByName.get(employeeName) ?? PRESENT_LABEL_HE,
  }));
  for (const [employeeName, labelHe] of absentByName) {
    if (!employeeNames.includes(employeeName)) {
      entries.push({ employeeName, labelHe });
    }
  }
  return entries;
}

export function formatAttendanceList(entries: AttendanceEntry[]): string {
  return entries.map((e) => `${e.employeeName} - ${e.labelHe}`).join("\n");
}

export async function fetchLeaveTypes(): Promise<LeaveType[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("leave_types")
    .select("id, label_he, color_key, sort_order, weekend_applicable")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Requests whose [start_date, end_date] range overlaps [rangeStart, rangeEnd]
 * (both ISO dates). Pass `profileId` to scope this to one person's own
 * requests — callers use it for non-admins, who should only ever see their
 * own, app-wide; admins omit it to see everyone's. Keyed by the stable
 * profile id rather than the display-name text, so it can't drift on a
 * duplicate name or an admin-initiated rename. */
export async function fetchRequestsInRange(
  rangeStart: string,
  rangeEnd: string,
  profileId?: string,
): Promise<LeaveRequest[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  let query = supabase
    .from("leave_requests")
    .select("id, employee_name, profile_id, leave_type_id, start_date, end_date, reason, status")
    .is("deleted_at", null)
    .lte("start_date", rangeEnd)
    .gte("end_date", rangeStart);
  if (profileId) {
    query = query.eq("profile_id", profileId);
  }
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type LeavePageData = {
  leaveTypes: LeaveType[];
  requests: LeaveRequest[];
  employeeNames: string[];
};

/** The three fetches every top-level page needs — leave types, requests
 * scoped to the viewer (everyone's, for an admin; only their own otherwise),
 * and the employee-name list an admin's "add request" picker needs — run in
 * parallel. Shared by `/` and `/requests`, which both need exactly this. */
export async function fetchLeavePageData(
  rangeStart: string,
  rangeEnd: string,
  currentUser: CurrentUser,
): Promise<LeavePageData> {
  const isAdmin = currentUser.role === "admin";
  const [leaveTypes, requests, profiles] = await Promise.all([
    fetchLeaveTypes(),
    fetchRequestsInRange(rangeStart, rangeEnd, isAdmin ? undefined : currentUser.id),
    isAdmin ? fetchAllUsers() : Promise.resolve([]),
  ]);
  return {
    leaveTypes,
    requests,
    employeeNames: profiles.map((p) => p.display_name),
  };
}
