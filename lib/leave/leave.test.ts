import { describe, expect, it } from "vitest";
import {
  approvedDayCountsByType,
  approvedRequestsByTypeForDay,
  attendanceForDay,
  formatAttendanceList,
  isApprovedOnDay,
  isRangeBoundaryHidden,
  isVisibleOnDay,
  type LeaveRequest,
  type LeaveType,
} from "./leave";

function leaveType(overrides: Partial<LeaveType> = {}): LeaveType {
  return {
    id: "lt-1",
    label_he: "חופשה",
    color_key: "vacation",
    sort_order: 0,
    weekend_applicable: true,
    full_day: true,
    ...overrides,
  };
}

function request(overrides: Partial<LeaveRequest> = {}): LeaveRequest {
  return {
    id: "r-1",
    employee_name: "דנה",
    profile_id: null,
    leave_type_id: "lt-1",
    start_date: "2026-10-25",
    end_date: "2026-10-25",
    reason: null,
    status: "approved",
    decided_by_name: null,
    decided_at: null,
    ...overrides,
  };
}

// A Sunday, well away from any weekend edge case.
const DAY = new Date(2026, 9, 25);
// Friday/Saturday of that same week.
const FRIDAY = new Date(2026, 9, 30);
const SATURDAY = new Date(2026, 9, 31);

describe("isVisibleOnDay", () => {
  it("is always visible on a weekday", () => {
    expect(isVisibleOnDay(leaveType({ weekend_applicable: false }), DAY)).toBe(true);
  });

  it("is visible on the weekend when weekend_applicable is true", () => {
    expect(isVisibleOnDay(leaveType({ weekend_applicable: true }), FRIDAY)).toBe(true);
    expect(isVisibleOnDay(leaveType({ weekend_applicable: true }), SATURDAY)).toBe(true);
  });

  it("is hidden on the weekend when weekend_applicable is false", () => {
    expect(isVisibleOnDay(leaveType({ weekend_applicable: false }), FRIDAY)).toBe(false);
    expect(isVisibleOnDay(leaveType({ weekend_applicable: false }), SATURDAY)).toBe(false);
  });
});

describe("isRangeBoundaryHidden", () => {
  it("is false for a single weekday", () => {
    expect(isRangeBoundaryHidden(leaveType({ weekend_applicable: false }), DAY, DAY)).toBe(
      false,
    );
  });

  it("is true when both boundaries are hidden", () => {
    expect(
      isRangeBoundaryHidden(leaveType({ weekend_applicable: false }), FRIDAY, SATURDAY),
    ).toBe(true);
  });

  // Regression: a weekend-inapplicable type's end date could be set to a
  // Friday/Saturday — the range wasn't "entirely hidden" (the start was a
  // visible weekday), so it slipped through, even though the stored range
  // then silently includes a day the type never actually applies to.
  it("is true when only the end boundary is hidden, even with a visible start", () => {
    // Thursday through Saturday: Thursday is visible, but the end (Saturday)
    // isn't.
    const thursday = new Date(2026, 9, 29);
    expect(
      isRangeBoundaryHidden(leaveType({ weekend_applicable: false }), thursday, SATURDAY),
    ).toBe(true);
  });

  it("is true when only the start boundary is hidden, even with a visible end", () => {
    // Friday through Sunday: the start (Friday) is hidden, Sunday isn't.
    const sunday = new Date(2026, 10, 1);
    expect(
      isRangeBoundaryHidden(leaveType({ weekend_applicable: false }), FRIDAY, sunday),
    ).toBe(true);
  });

  it("is false when both boundaries are visible, even if the range crosses a hidden weekend", () => {
    // Thursday through Sunday: the weekend in between is hidden, but both
    // boundaries are visible weekdays — a legitimate "out through the
    // weekend" request.
    const thursday = new Date(2026, 9, 29);
    const sunday = new Date(2026, 10, 1);
    expect(
      isRangeBoundaryHidden(leaveType({ weekend_applicable: false }), thursday, sunday),
    ).toBe(false);
  });

  it("is false for a weekend-applicable type across a weekend range", () => {
    expect(
      isRangeBoundaryHidden(leaveType({ weekend_applicable: true }), FRIDAY, SATURDAY),
    ).toBe(false);
  });
});

describe("isApprovedOnDay", () => {
  it("matches an approved request covering the day", () => {
    expect(isApprovedOnDay(request(), leaveType(), DAY)).toBe(true);
  });

  it("rejects a request for a different leave type", () => {
    expect(isApprovedOnDay(request({ leave_type_id: "lt-2" }), leaveType(), DAY)).toBe(false);
  });

  it("rejects a pending or denied request", () => {
    expect(isApprovedOnDay(request({ status: "pending" }), leaveType(), DAY)).toBe(false);
    expect(isApprovedOnDay(request({ status: "denied" }), leaveType(), DAY)).toBe(false);
  });

  it("rejects a day outside the request's range", () => {
    const r = request({ start_date: "2026-10-26", end_date: "2026-10-26" });
    expect(isApprovedOnDay(r, leaveType(), new Date(2026, 9, 27))).toBe(false);
  });

  it("matches every day within a multi-day range", () => {
    const r = request({ start_date: "2026-10-20", end_date: "2026-10-28" });
    expect(isApprovedOnDay(r, leaveType(), DAY)).toBe(true);
  });

  it("respects weekend_applicable=false on a Friday/Saturday", () => {
    const lt = leaveType({ weekend_applicable: false });
    const r = request({ start_date: "2026-10-25", end_date: "2026-10-31" });
    expect(isApprovedOnDay(r, lt, DAY)).toBe(true);
    expect(isApprovedOnDay(r, lt, FRIDAY)).toBe(false);
    expect(isApprovedOnDay(r, lt, SATURDAY)).toBe(false);
  });
});

describe("attendanceForDay", () => {
  it("marks everyone with no approved request as present", () => {
    const entries = attendanceForDay([leaveType()], [], ["דנה", "יוסי"], DAY);
    expect(entries).toEqual([
      { employeeName: "דנה", labelHe: "נוכח" },
      { employeeName: "יוסי", labelHe: "נוכח" },
    ]);
  });

  it("labels an absent employee with their leave type", () => {
    const entries = attendanceForDay(
      [leaveType({ label_he: "חופשה" })],
      [request()],
      ["דנה", "יוסי"],
      DAY,
    );
    expect(entries).toEqual([
      { employeeName: "דנה", labelHe: "חופשה" },
      { employeeName: "יוסי", labelHe: "נוכח" },
    ]);
  });

  it("appends a recorded absence for a name missing from the roster", () => {
    const entries = attendanceForDay(
      [leaveType()],
      [request({ employee_name: "עומר" })],
      ["דנה"],
      DAY,
    );
    expect(entries).toEqual([
      { employeeName: "דנה", labelHe: "נוכח" },
      { employeeName: "עומר", labelHe: "חופשה" },
    ]);
  });

  // The edge case flagged this session: two different approved leave types
  // for the same person on the same day used to silently drop one.
  it("combines two different approved leave types for the same person on the same day", () => {
    const vacation = leaveType({ id: "lt-vacation", label_he: "חופשה" });
    const medical = leaveType({ id: "lt-medical", label_he: "מחלה" });
    const requests = [
      request({ id: "r-1", leave_type_id: "lt-vacation" }),
      request({ id: "r-2", leave_type_id: "lt-medical" }),
    ];
    const entries = attendanceForDay([vacation, medical], requests, ["דנה"], DAY);
    expect(entries).toEqual([{ employeeName: "דנה", labelHe: "חופשה, מחלה" }]);
  });

  it("doesn't duplicate the same label for overlapping requests of the same type", () => {
    const requests = [
      request({ id: "r-1", start_date: "2026-10-24", end_date: "2026-10-26" }),
      request({ id: "r-2", start_date: "2026-10-25", end_date: "2026-10-27" }),
    ];
    const entries = attendanceForDay([leaveType()], requests, ["דנה"], DAY);
    expect(entries).toEqual([{ employeeName: "דנה", labelHe: "חופשה" }]);
  });

  it("counts someone approved only for a non-full-day type as present", () => {
    const earlyLeave = leaveType({ label_he: "יציאה מוקדמת", full_day: false });
    const entries = attendanceForDay([earlyLeave], [request()], ["דנה"], DAY);
    expect(entries).toEqual([{ employeeName: "דנה", labelHe: "נוכח" }]);
  });

  it("still labels a non-full-day type alongside a full-day one for the same person", () => {
    const vacation = leaveType({ id: "lt-vacation", label_he: "חופשה" });
    const earlyLeave = leaveType({ id: "lt-early", label_he: "יציאה מוקדמת", full_day: false });
    const requests = [
      request({ id: "r-1", leave_type_id: "lt-vacation" }),
      request({ id: "r-2", leave_type_id: "lt-early" }),
    ];
    const entries = attendanceForDay([vacation, earlyLeave], requests, ["דנה"], DAY);
    expect(entries).toEqual([{ employeeName: "דנה", labelHe: "חופשה" }]);
  });
});

describe("approvedRequestsByTypeForDay", () => {
  it("groups approved requests under their leave type id", () => {
    const lt = leaveType();
    const r = request();
    const byType = approvedRequestsByTypeForDay([lt], [r], DAY);
    expect(byType.get(lt.id)).toEqual([r]);
  });

  it("has an empty array for a type with no approved requests on the day", () => {
    const lt = leaveType();
    const byType = approvedRequestsByTypeForDay([lt], [], DAY);
    expect(byType.get(lt.id)).toEqual([]);
  });
});

describe("approvedDayCountsByType", () => {
  it("counts every type at 0 when there are no requests", () => {
    const lt = leaveType();
    const counts = approvedDayCountsByType([lt], [], DAY, DAY);
    expect(counts.get(lt.id)).toBe(0);
  });

  it("counts each day of a multi-day approved request", () => {
    const lt = leaveType();
    const r = request({ start_date: "2026-10-20", end_date: "2026-10-22" });
    const counts = approvedDayCountsByType(
      [lt],
      [r],
      new Date(2026, 9, 20),
      new Date(2026, 9, 22),
    );
    expect(counts.get(lt.id)).toBe(3);
  });

  it("doesn't count a pending or denied request", () => {
    const lt = leaveType();
    const r = request({ status: "pending" });
    expect(approvedDayCountsByType([lt], [r], DAY, DAY).get(lt.id)).toBe(0);
  });

  it("doesn't double-count two overlapping approved requests of the same type on the same day", () => {
    const lt = leaveType();
    const requests = [
      request({ id: "r-1", start_date: "2026-10-24", end_date: "2026-10-26" }),
      request({ id: "r-2", start_date: "2026-10-25", end_date: "2026-10-27" }),
    ];
    const counts = approvedDayCountsByType([lt], requests, DAY, DAY);
    expect(counts.get(lt.id)).toBe(1);
  });

  it("respects weekend_applicable=false within the range", () => {
    const lt = leaveType({ weekend_applicable: false });
    const r = request({ start_date: "2026-10-30", end_date: "2026-11-01" }); // Fri–Sun
    const counts = approvedDayCountsByType([lt], [r], FRIDAY, new Date(2026, 10, 1));
    // Only the Sunday counts; Friday/Saturday are hidden for this type.
    expect(counts.get(lt.id)).toBe(1);
  });
});

describe("formatAttendanceList", () => {
  it("joins each entry as 'name - label' on its own line", () => {
    const text = formatAttendanceList([
      { employeeName: "דנה", labelHe: "נוכח" },
      { employeeName: "יוסי", labelHe: "חופשה" },
    ]);
    expect(text).toBe("דנה - נוכח\nיוסי - חופשה");
  });
});
