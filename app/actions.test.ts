import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@/lib/auth/auth";

// Regression guard for the bug where addLeaveRequest/setLeaveRequestStatus
// awaited the push notification inline, blocking the response on a DB
// lookup plus an HTTP round-trip per subscriber. after() must schedule the
// notify call instead of the action awaiting it directly.
const { afterMock, notifyAdminsOfNewRequest, notifyEmployeeOfDecision } = vi.hoisted(() => ({
  afterMock: vi.fn(),
  notifyAdminsOfNewRequest: vi.fn(),
  notifyEmployeeOfDecision: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: afterMock }));
vi.mock("@/lib/push/notify", () => ({
  notifyAdminsOfNewRequest,
  notifyEmployeeOfDecision,
}));

const { getCurrentUser, requireAdmin } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  requireAdmin: vi.fn(),
}));
vi.mock("@/lib/auth/auth", () => ({ getCurrentUser, requireAdmin }));

const { resolveEmployeeName } = vi.hoisted(() => ({ resolveEmployeeName: vi.fn() }));
vi.mock("@/lib/leave/resolveEmployeeName", () => ({ resolveEmployeeName }));

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient,
  supabaseConfigured: true,
  requireSupabaseClient: async () => {
    const supabase = await createClient();
    return supabase ? { supabase } : { error: "Supabase לא מחובר עדיין." };
  },
}));

const { addLeaveRequest, updateLeaveRequest, setLeaveRequestStatus } = await import("./actions");

const user: CurrentUser = {
  id: "user-1",
  email: "dana@example.com",
  displayName: "דנה",
  role: "employee",
};

const leaveType = {
  label_he: "חופשה",
  color_key: "blue",
  sort_order: 1,
  weekend_applicable: true,
  full_day: true,
};

function addRequestFormData(): FormData {
  const fd = new FormData();
  fd.set("leave_type_id", "type-1");
  fd.set("date", "2026-11-05");
  fd.set("end_date", "2026-11-05");
  return fd;
}

beforeEach(() => {
  afterMock.mockReset();
  notifyAdminsOfNewRequest.mockReset();
  notifyEmployeeOfDecision.mockReset();
  getCurrentUser.mockReset().mockResolvedValue(user);
  requireAdmin.mockReset();
  resolveEmployeeName.mockReset().mockResolvedValue({
    employeeName: "דנה",
    profileId: "user-1",
  });
  createClient.mockReset();
});

describe("addLeaveRequest", () => {
  it("defers the admin push notification via after() instead of awaiting it", async () => {
    createClient.mockResolvedValue({
      from(table: string) {
        if (table === "leave_types") {
          return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: leaveType }) }) }) };
        }
        if (table === "leave_requests") {
          return {
            select: () => ({
              eq: () => ({
                is: () => ({
                  neq: () => ({
                    lte: () => ({
                      gte: () => ({
                        limit: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
            insert: async () => ({ error: null }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
    });

    const result = await addLeaveRequest({}, addRequestFormData());

    expect(result).toEqual({ ok: true });
    expect(notifyAdminsOfNewRequest).not.toHaveBeenCalled();
    expect(afterMock).toHaveBeenCalledTimes(1);

    await afterMock.mock.calls[0][0]();
    expect(notifyAdminsOfNewRequest).toHaveBeenCalledWith("דנה");
  });

  it("blocks a request that overlaps an existing one for the same employee", async () => {
    const insert = vi.fn();
    createClient.mockResolvedValue({
      from(table: string) {
        if (table === "leave_types") {
          return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: leaveType }) }) }) };
        }
        if (table === "leave_requests") {
          return {
            select: () => ({
              eq: () => ({
                is: () => ({
                  neq: () => ({
                    lte: () => ({
                      gte: () => ({
                        limit: () => ({
                          maybeSingle: async () => ({ data: { id: "existing" }, error: null }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
            insert,
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
    });

    const result = await addLeaveRequest({}, addRequestFormData());

    expect(result).toEqual({ error: "קיימת בקשה חופפת בתאריכים אלו" });
    expect(insert).not.toHaveBeenCalled();
    expect(afterMock).not.toHaveBeenCalled();
  });
});

describe("updateLeaveRequest", () => {
  it("blocks a non-admin from editing someone else's request via a guessed id", async () => {
    const updateEq = vi.fn(() => ({
      is: () => ({
        eq: () => ({ select: async () => ({ data: [], error: null }) }),
      }),
    }));
    createClient.mockResolvedValue({
      from(table: string) {
        if (table === "leave_types") {
          return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: leaveType }) }) }) };
        }
        if (table === "leave_requests") {
          return {
            select: () => ({
              eq: () => ({
                is: () => ({
                  neq: () => ({
                    lte: () => ({
                      gte: () => ({
                        limit: () => ({
                          neq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
            update: () => ({ eq: updateEq }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
    });

    const fd = new FormData();
    fd.set("id", "someone-elses-request");
    fd.set("leave_type_id", "type-1");
    fd.set("date", "2026-11-05");
    fd.set("end_date", "2026-11-05");

    const result = await updateLeaveRequest({}, fd);

    // The DB-level .eq("profile_id", ...) scoping (not just the UI) is what
    // actually blocks this — matching 0 rows is indistinguishable, from the
    // action's point of view, from the request having been deleted.
    expect(result).toEqual({ error: "הבקשה נמחקה ולא ניתן יותר לערוך אותה" });
    expect(updateEq).toHaveBeenCalledWith("id", "someone-elses-request");
    expect(resolveEmployeeName).not.toHaveBeenCalled();
  });

  it("blocks an edit that would overlap another existing request for the same employee", async () => {
    const update = vi.fn();
    createClient.mockResolvedValue({
      from(table: string) {
        if (table === "leave_types") {
          return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: leaveType }) }) }) };
        }
        if (table === "leave_requests") {
          return {
            select: () => ({
              eq: () => ({
                is: () => ({
                  neq: () => ({
                    lte: () => ({
                      gte: () => ({
                        limit: () => ({
                          neq: () => ({
                            maybeSingle: async () => ({ data: { id: "other-request" }, error: null }),
                          }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
            update,
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
    });

    const fd = new FormData();
    fd.set("id", "req-own");
    fd.set("leave_type_id", "type-1");
    fd.set("date", "2026-11-05");
    fd.set("end_date", "2026-11-05");

    const result = await updateLeaveRequest({}, fd);

    expect(result).toEqual({ error: "קיימת בקשה חופפת בתאריכים אלו" });
    expect(update).not.toHaveBeenCalled();
  });
});

describe("setLeaveRequestStatus", () => {
  it("defers the employee push notification via after() instead of awaiting it", async () => {
    requireAdmin.mockResolvedValue({ user: { ...user, id: "admin-1", role: "admin" } });
    createClient.mockResolvedValue({
      from: () => ({
        update: () => ({
          eq: () => ({
            is: () => ({
              select: async () => ({
                data: [{ id: "req-1", profile_id: "user-1" }],
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    const result = await setLeaveRequestStatus("req-1", "approved");

    expect(result).toEqual({});
    expect(notifyEmployeeOfDecision).not.toHaveBeenCalled();
    expect(afterMock).toHaveBeenCalledTimes(1);

    await afterMock.mock.calls[0][0]();
    expect(notifyEmployeeOfDecision).toHaveBeenCalledWith("user-1", "approved");
  });
});
