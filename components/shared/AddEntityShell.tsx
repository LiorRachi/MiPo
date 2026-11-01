"use client";

// Shared by AddUserForm and AddLeaveTypeForm: both are a collapsed "+ add"
// toggle that expands into a form with the same head (title + close button),
// error line, and submit button — only the fields in between differ, which
// stay as each form's own `children`. `open` state lives in the caller, not
// here, since the caller's useActionState success callback needs to close
// the form itself (via `onOpenChange`) once the create action succeeds.
export default function AddEntityShell({
  open,
  onOpenChange,
  toggleLabel,
  title,
  error,
  pending,
  submitLabel,
  pendingLabel,
  formRef,
  formAction,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toggleLabel: string;
  title: string;
  error?: string;
  pending: boolean;
  submitLabel: string;
  pendingLabel: string;
  formRef: React.RefObject<HTMLFormElement | null>;
  formAction: (formData: FormData) => void;
  children: React.ReactNode;
}) {
  if (!open) {
    return (
      <button
        type="button"
        className="settings-add-toggle"
        onClick={() => onOpenChange(true)}
      >
        <span className="plus">+</span> {toggleLabel}
      </button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="settings-add-form">
      <div className="settings-add-form-head">
        <h3>{title}</h3>
        <button
          type="button"
          className="icon-btn"
          onClick={() => onOpenChange(false)}
          aria-label="סגירה"
        >
          ✕
        </button>
      </div>
      {error && <div className="form-error">{error}</div>}
      {children}
      <button type="submit" className="btn primary" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
