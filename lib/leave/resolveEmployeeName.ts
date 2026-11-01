import type { CurrentUser } from "@/lib/auth/auth";
import { normailzeFieldValue } from "@/lib/utils/formUtils";
import { fetchAllUsers } from "@/lib/auth/users";

// The employee_name a non-admin submits is never trusted (a disabled/hidden
// client field is still spoofable) — for them it's always their own
// name/id, taken from the session. Only an admin may pick a different name,
// resolved against the real profiles list rather than taken as free text.
// A profile match always wins, even when the submitted name is unchanged
// from the row's current one — otherwise every edit that leaves the name
// dropdown untouched (the common case) would be mistaken for "preserving a
// legacy name" and silently drop a perfectly valid profile_id.
// `allowedExtraName` only kicks in once no profile matches: it lets an edit
// keep a request's existing name even when it isn't a registered profile
// (e.g. free-text names entered before this feature existed) — the select
// still offers it as an option (see RequestFormFields) precisely so it
// round-trips unchanged rather than silently reassigning the request to
// whichever name happened to be first. Callers must pass the row's *actual
// current* employee_name (read from the DB), not a client-supplied value —
// otherwise a tampered hidden field would let an admin bypass the profiles
// check entirely for an arbitrary string.
//
// Kept in its own module (rather than inline in app/actions.ts) so it can be
// unit-tested directly — a "use server" file can only export Server
// Actions, which would turn this plain helper into one too.
export async function resolveEmployeeName(
  formData: FormData,
  currentUser: CurrentUser,
  allowedExtraName?: string,
): Promise<{ error: string } | { employeeName: string; profileId: string | null }> {
  if (currentUser.role !== "admin") {
    return { employeeName: currentUser.displayName, profileId: currentUser.id };
  }

  const submitted = normailzeFieldValue(formData, "employee_name");
  if (!submitted) return { error: "נא לבחור שם חייל/ת" };

  const profiles = await fetchAllUsers(currentUser).catch(() => null);
  if (!profiles) return { error: "שגיאה בטעינת רשימת המשתמשים, נסו שוב." };

  const match = profiles.find((p) => p.display_name === submitted);
  if (match) return { employeeName: submitted, profileId: match.id };

  if (submitted === allowedExtraName) {
    // No profile matches, but it's the row's own current name — preserve it
    // unchanged rather than reject the edit.
    return { employeeName: submitted, profileId: null };
  }

  return { error: "שם לא תקין" };
}
