import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@/lib/auth/auth";
import type { Profile } from "@/lib/auth/users";

const { fetchAllUsers } = vi.hoisted(() => ({ fetchAllUsers: vi.fn() }));
vi.mock("@/lib/auth/users", () => ({ fetchAllUsers }));

const { resolveEmployeeName } = await import("./resolveEmployeeName");

function user(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: "user-1",
    email: "dana@example.com",
    displayName: "דנה",
    role: "employee",
    ...overrides,
  };
}

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "profile-1",
    email: "dana@example.com",
    display_name: "דנה",
    role: "employee",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function formDataWithEmployeeName(name?: string): FormData {
  const fd = new FormData();
  if (name !== undefined) fd.set("employee_name", name);
  return fd;
}

beforeEach(() => {
  fetchAllUsers.mockReset();
});

describe("resolveEmployeeName", () => {
  it("always resolves a non-admin to their own session identity, ignoring the form", async () => {
    const result = await resolveEmployeeName(
      formDataWithEmployeeName("someone else"),
      user({ role: "employee", displayName: "דנה", id: "user-1" }),
    );
    expect(result).toEqual({ employeeName: "דנה", profileId: "user-1" });
    expect(fetchAllUsers).not.toHaveBeenCalled();
  });

  it("requires an admin to submit a name", async () => {
    const result = await resolveEmployeeName(formDataWithEmployeeName(), user({ role: "admin" }));
    expect(result).toEqual({ error: "נא לבחור שם חייל/ת" });
    expect(fetchAllUsers).not.toHaveBeenCalled();
  });

  it("resolves an admin's submitted name to the matching profile's id", async () => {
    fetchAllUsers.mockResolvedValue([
      profile({ id: "p-1", display_name: "יוסי" }),
      profile({ id: "p-2", display_name: "דנה" }),
    ]);
    const result = await resolveEmployeeName(
      formDataWithEmployeeName("דנה"),
      user({ role: "admin" }),
    );
    expect(result).toEqual({ employeeName: "דנה", profileId: "p-2" });
  });

  it("prefers a real profile match over the allowed-extra-name fallback", async () => {
    fetchAllUsers.mockResolvedValue([profile({ id: "p-2", display_name: "דנה" })]);
    const result = await resolveEmployeeName(
      formDataWithEmployeeName("דנה"),
      user({ role: "admin" }),
      "דנה",
    );
    expect(result).toEqual({ employeeName: "דנה", profileId: "p-2" });
  });

  it("keeps a legacy name with no matching profile when it matches allowedExtraName", async () => {
    fetchAllUsers.mockResolvedValue([profile({ id: "p-1", display_name: "יוסי" })]);
    const result = await resolveEmployeeName(
      formDataWithEmployeeName("שם ישן"),
      user({ role: "admin" }),
      "שם ישן",
    );
    expect(result).toEqual({ employeeName: "שם ישן", profileId: null });
  });

  it("rejects a name with no matching profile and no allowed-extra-name match", async () => {
    fetchAllUsers.mockResolvedValue([profile({ id: "p-1", display_name: "יוסי" })]);
    const result = await resolveEmployeeName(
      formDataWithEmployeeName("מישהו אחר"),
      user({ role: "admin" }),
      "שם ישן",
    );
    expect(result).toEqual({ error: "שם לא תקין" });
  });

  it("surfaces a friendly error when the profiles list fails to load", async () => {
    fetchAllUsers.mockRejectedValue(new Error("boom"));
    const result = await resolveEmployeeName(
      formDataWithEmployeeName("דנה"),
      user({ role: "admin" }),
    );
    expect(result).toEqual({ error: "שגיאה בטעינת רשימת המשתמשים, נסו שוב." });
  });
});
