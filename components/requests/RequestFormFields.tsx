import { isRangeBoundaryHidden, isVisibleOnDay, type LeaveType } from "@/lib/leave/leaveRules";

export default function RequestFormFields({
  leaveTypes,
  selectedType,
  onSelectType,
  defaultEmployeeName,
  date,
  onDateChange,
  parsedDate,
  endDate,
  onEndDateChange,
  parsedEndDate,
  defaultReason,
  isAdmin,
  employeeNames,
  currentUserDisplayName,
}: {
  leaveTypes: LeaveType[];
  selectedType: string;
  onSelectType: (id: string) => void;
  defaultEmployeeName?: string;
  date: string;
  onDateChange: (value: string) => void;
  parsedDate: Date | null;
  endDate: string;
  onEndDateChange: (value: string) => void;
  parsedEndDate: Date | null;
  defaultReason?: string | null;
  isAdmin: boolean;
  employeeNames: string[];
  currentUserDisplayName: string;
}) {
  return (
    <>
      <div className="field">
        <label htmlFor="employee_name">חייל/ת</label>
        {isAdmin ? (
          <select
            id="employee_name"
            name="employee_name"
            defaultValue={defaultEmployeeName ?? ""}
            required
          >
            {/* No real default on add: force an explicit choice instead of
                silently defaulting to the admin's own name, which an admin
                logging leave for someone else could easily miss. */}
            {!defaultEmployeeName && (
              <option value="" disabled>
                בחר שם...
              </option>
            )}
            {/* A request created before this field existed, or whose name
                was since renamed/removed from the profiles list, can carry
                a name with no matching option — add it so the select shows
                it correctly instead of silently falling back to the first
                real option (which would reassign the request on save). */}
            {defaultEmployeeName &&
              !employeeNames.includes(defaultEmployeeName) && (
                <option value={defaultEmployeeName}>
                  {defaultEmployeeName}
                </option>
              )}
            {employeeNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        ) : (
          // Non-admins can't choose or change the name — it's always their
          // own, derived server-side from the session (see app/actions.ts).
          // This is display-only; nothing named employee_name submits here.
          <div className="static-value">
            {defaultEmployeeName ?? currentUserDisplayName}
          </div>
        )}
      </div>
      <div className="field">
        <label>סוג חופשה</label>
        <div className="type-pick">
          {leaveTypes.map((lt) => {
            const blocked =
              parsedDate && parsedEndDate
                ? isRangeBoundaryHidden(lt, parsedDate, parsedEndDate)
                : parsedDate
                  ? !isVisibleOnDay(lt, parsedDate)
                  : false;
            return (
              <button
                type="button"
                key={lt.id}
                className={`${lt.color_key}${selectedType === lt.id ? " sel" : ""}`}
                onClick={() => onSelectType(lt.id)}
                disabled={blocked}
                title={blocked ? `${lt.label_he} לא חל בסופ"ש` : undefined}
              >
                {lt.label_he}
              </button>
            );
          })}
        </div>
      </div>
      <div className="field">
        <label htmlFor="date">תאריך</label>
        <input
          id="date"
          name="date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="end_date">עד תאריך</label>
        <input
          id="end_date"
          name="end_date"
          type="date"
          value={endDate}
          min={date}
          onChange={(e) => onEndDateChange(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="reason">סיבה (אופציונלי)</label>
        <textarea
          id="reason"
          name="reason"
          rows={2}
          defaultValue={defaultReason ?? undefined}
        />
      </div>
    </>
  );
}
