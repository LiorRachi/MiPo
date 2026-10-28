import { isWeekend, toISODate } from "./date";
import { createClient } from "./supabase/server";

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

export type AttendanceEntry = { employeeName: string; labelHe: string };

/** Everyone approved to be out on `day`, across all leave types — the same
 * "approved + visible on this day" rule the week-grid cells use, flattened
 * into name/type pairs for the copy-to-clipboard attendance list. */
export function attendanceForDay(
  leaveTypes: LeaveType[],
  requests: LeaveRequest[],
  day: Date,
): AttendanceEntry[] {
  const iso = toISODate(day);
  const entries: AttendanceEntry[] = [];
  for (const lt of leaveTypes) {
    if (!isVisibleOnDay(lt, day)) continue;
    for (const r of requests) {
      if (
        r.leave_type_id === lt.id &&
        r.status === "approved" &&
        r.start_date <= iso &&
        r.end_date >= iso
      ) {
        entries.push({ employeeName: r.employee_name, labelHe: lt.label_he });
      }
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
