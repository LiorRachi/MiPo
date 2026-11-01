// Shared by UserRow and LeaveTypeRow, whose settings-row forms each end in
// the same save/delete icon-button pair.

export function SaveRowButton({ disabled }: { disabled?: boolean }) {
  return (
    <button
      type="submit"
      className="btn ghost icon"
      disabled={disabled}
      aria-label="שמירה"
      title="שמירה"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </button>
  );
}

export function DeleteRowButton({
  form,
  disabled,
}: {
  form: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      form={form}
      className="btn danger icon"
      disabled={disabled}
      aria-label="מחיקה"
      title="מחיקה"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    </button>
  );
}
