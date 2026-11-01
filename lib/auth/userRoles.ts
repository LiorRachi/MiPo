// Split out from lib/users.ts: that module pulls in server-only code
// (service-role client, next/headers via requireAdmin), so it can't be
// imported from a Client Component. This file has no such dependency.

export type UserRole = "admin" | "employee";

/** The role picker's options, in the order every role <select> shows them —
 * one list so the Hebrew labels and value/role mapping can't drift between
 * the add-user form and each user row. */
export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "employee", label: "עובד/ת" },
  { value: "admin", label: "מנהל/ת" },
];
