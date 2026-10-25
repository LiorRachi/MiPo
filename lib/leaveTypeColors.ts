// Keep in sync with supabase/schema.sql's leave_types_color_key_check and
// the matching --leave-<key> tokens + .dot/.chip/.type-pick/.type-tag
// classes in app/globals.css.
export const LEAVE_TYPE_COLORS = [
  "vacation",
  "medical",
  "other",
  "green",
  "teal",
  "rose",
] as const;

export type LeaveTypeColor = (typeof LEAVE_TYPE_COLORS)[number];

export function isValidColorKey(value: string): value is LeaveTypeColor {
  return (LEAVE_TYPE_COLORS as readonly string[]).includes(value);
}

export const COLOR_LABELS_HE: Record<LeaveTypeColor, string> = {
  vacation: "כחול",
  medical: "כתום",
  other: "סגול",
  green: "ירוק",
  teal: "טורקיז",
  rose: "ורוד",
};
