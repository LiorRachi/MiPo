import { supabase } from "./supabase";

export type LeaveType = {
  id: string;
  label_he: string;
  color_key: string;
  sort_order: number;
};

export type LeaveRequest = {
  id: string;
  employee_name: string;
  leave_type_id: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
};

export async function fetchLeaveTypes(): Promise<LeaveType[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("leave_types")
    .select("id, label_he, color_key, sort_order")
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
    .select("id, employee_name, leave_type_id, start_date, end_date")
    .lte("start_date", rangeEnd)
    .gte("end_date", rangeStart)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
