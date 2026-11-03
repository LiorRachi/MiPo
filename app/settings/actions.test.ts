import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@/lib/auth/auth";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { requireAdmin } = vi.hoisted(() => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/auth/auth", () => ({ requireAdmin }));

const { createAdminClient } = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));

const { createUser } = await import("./actions");

const adminUser: CurrentUser = {
  id: "admin-1",
  email: "admin@example.com",
  displayName: "מנהל",
  role: "admin",
};

function newUserFormData(): FormData {
  const fd = new FormData();
  fd.set("email", "new@example.com");
  fd.set("password", "password123");
  fd.set("display_name", "חדש");
  fd.set("role", "employee");
  return fd;
}

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({ user: adminUser });
  createAdminClient.mockReset();
});

describe("createUser", () => {
  it("reports an unrecoverable orphan when the rollback delete also fails", async () => {
    const deleteUser = vi.fn().mockResolvedValue({ error: { message: "delete failed" } });
    createAdminClient.mockReturnValue({
      from(table: string) {
        if (table === "profiles") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
            insert: async () => ({ error: { message: "insert failed" } }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
      auth: {
        admin: {
          createUser: async () => ({ data: { user: { id: "orphan-1" } }, error: null }),
          deleteUser,
        },
      },
    });

    const result = await createUser({}, newUserFormData());

    expect(result).toEqual({
      error:
        "יצירת המשתמש נכשלה ונוצר חשבון שלא ניתן היה לנקות אוטומטית (מזהה: orphan-1). יש לפנות לתמיכה.",
    });
    expect(deleteUser).toHaveBeenCalledWith("orphan-1");
  });
});
