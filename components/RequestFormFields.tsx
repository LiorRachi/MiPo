import type { LeaveType } from "@/lib/leave";

export default function RequestFormFields({
  leaveTypes,
  selectedType,
  onSelectType,
  defaultEmployeeName,
  defaultDate,
  defaultReason,
}: {
  leaveTypes: LeaveType[];
  selectedType: string;
  onSelectType: (id: string) => void;
  defaultEmployeeName?: string;
  defaultDate: string;
  defaultReason?: string | null;
}) {
  return (
    <>
      <div className="field">
        <label htmlFor="employee_name">חייל/ת</label>
        <input
          id="employee_name"
          name="employee_name"
          type="text"
          defaultValue={defaultEmployeeName}
          required
        />
      </div>
      <div className="field">
        <label>סוג חופשה</label>
        <div className="type-pick">
          {leaveTypes.map((lt) => (
            <button
              type="button"
              key={lt.id}
              className={`${lt.color_key}${selectedType === lt.id ? " sel" : ""}`}
              onClick={() => onSelectType(lt.id)}
            >
              {lt.label_he}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor="date">תאריך</label>
        <input
          id="date"
          name="date"
          type="date"
          defaultValue={defaultDate}
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
