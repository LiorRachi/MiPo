import type { CurrentUser } from "@/lib/auth/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchAllUsers } from "@/lib/auth/users";
import type { LeaveRequest, LeaveType } from "./leaveRules";

// Supabase-backed fetches for the leave domain. Pure logic (no I/O) lives in
// ./leaveRules instead, so Client Components can import it without pulling
// the Supabase server client into their bundle — re-exported here too, for
// the Server Components/Actions that already import everything from "./leave".
export * from "./leaveRules";

const LEAVE_REQUEST_COLUMNS =
  "id, employee_name, profile_id, leave_type_id, start_date, end_date, reason, status, decided_by_name, decided_at";

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
    .select(LEAVE_REQUEST_COLUMNS)
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

/** All approved, non-deleted requests in range, regardless of owner — the
 * RLS policy allows any authenticated user to read an approved request
 * (see migration 20261101114346), so this is the one case where a
 * non-admin's fetch is intentionally unscoped by profile. */
export async function fetchApprovedRequestsInRange(
  rangeStart: string,
  rangeEnd: string,
): Promise<LeaveRequest[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("leave_requests")
    .select(LEAVE_REQUEST_COLUMNS)
    .eq("status", "approved")
    .is("deleted_at", null)
    .lte("start_date", rangeEnd)
    .gte("end_date", rangeStart)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type LeavePageData = {
  leaveTypes: LeaveType[];
  requests: LeaveRequest[];
  employeeNames: string[];
};

/** The three fetches `/requests` needs — leave types, requests scoped to the
 * viewer (everyone's, for an admin; only their own otherwise, any status),
 * and the employee-name list an admin's "add request" picker needs — run in
 * parallel. */
export async function fetchLeavePageData(
  rangeStart: string,
  rangeEnd: string,
  currentUser: CurrentUser,
): Promise<LeavePageData> {
  const isAdmin = currentUser.role === "admin";
  const [leaveTypes, requests, profiles] = await Promise.all([
    fetchLeaveTypes(),
    fetchRequestsInRange(rangeStart, rangeEnd, isAdmin ? undefined : currentUser.id),
    isAdmin ? fetchAllUsers(currentUser) : Promise.resolve([]),
  ]);
  return {
    leaveTypes,
    requests,
    employeeNames: profiles.map((p) => p.display_name),
  };
}

/** The same three fetches, but for `/` (the week-grid) — an admin still sees
 * everyone's requests of any status, but a non-admin sees the whole team's
 * *approved* requests (not just their own), matching the week-grid's
 * original "who's out" purpose. Pending/denied requests stay private to
 * their owner and admins; WeekGrid only ever renders approved ones anyway
 * (see isApprovedOnDay), so this just gives it more to filter through. */
export async function fetchWeekPageData(
  rangeStart: string,
  rangeEnd: string,
  currentUser: CurrentUser,
): Promise<LeavePageData> {
  const isAdmin = currentUser.role === "admin";
  const [leaveTypes, requests, profiles] = await Promise.all([
    fetchLeaveTypes(),
    isAdmin
      ? fetchRequestsInRange(rangeStart, rangeEnd)
      : fetchApprovedRequestsInRange(rangeStart, rangeEnd),
    isAdmin ? fetchAllUsers(currentUser) : Promise.resolve([]),
  ]);
  return {
    leaveTypes,
    requests,
    employeeNames: profiles.map((p) => p.display_name),
  };
}

/** The most recent decided_at among the current user's own requests, fetched
 * directly rather than derived from a page's (week- or month-scoped)
 * `requests` list — a decision on a request outside the currently displayed
 * range would otherwise never show the בקשות tab's unseen-decision badge
 * (see useUnseenDecisions). */
export async function latestOwnDecisionAt(profileId: string): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("leave_requests")
    .select("decided_at")
    .eq("profile_id", profileId)
    .is("deleted_at", null)
    .not("decided_at", "is", null)
    .order("decided_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.decided_at ?? null;
}
