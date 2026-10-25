import { isWeekend } from "./date";
import { supabase } from "./supabase";

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

export async function fetchLeaveTypes(): Promise<LeaveType[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("leave_types")
    .select("id, label_he, color_key, sort_order, weekend_applicable")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Requests whose [start_date, end_date] range overlaps [rangeStart, rangeEnd] (both ISO dates). */
export async function fetchRequestsInRange(
  rangeStart: string,
  rangeEnd: string,
): Promise<LeaveRequest[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("leave_requests")
    .select("id, employee_name, leave_type_id, start_date, end_date, reason, status")
    .lte("start_date", rangeEnd)
    .gte("end_date", rangeStart)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
