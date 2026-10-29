"use client";

import { useActionState, useRef, useState } from "react";
import { createUser, type UserActionState } from "@/app/settings/actions";
import { ROLE_OPTIONS } from "@/lib/userRoles";
import PasswordField from "./PasswordField";

const initialState: UserActionState = {};

export default function AddUserForm() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (prevState: UserActionState, formData: FormData) => {
      const result = await createUser(prevState, formData);
      if (result.ok) {
        formRef.current?.reset();
        setOpen(false);
      }
      return result;
    },
    initialState,
  );

  if (!open) {
    return (
      <button
        type="button"
        className="settings-add-toggle"
        onClick={() => setOpen(true)}
      >
        <span className="plus">+</span> הוספת משתמש
      </button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="settings-add-form">
      <div className="settings-add-form-head">
        <h3>הוספת משתמש</h3>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setOpen(false)}
          aria-label="סגירה"
        >
          ✕
        </button>
      </div>
      {state.error && <div className="form-error">{state.error}</div>}
      <div className="field">
        <label htmlFor="new-user-name">שם</label>
        <input id="new-user-name" name="display_name" type="text" required autoFocus />
      </div>
      <div className="field">
        <label htmlFor="new-user-email">אימייל</label>
        <input id="new-user-email" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="new-user-password">סיסמה</label>
        <PasswordField id="new-user-password" name="password" required minLength={8} />
      </div>
      <div className="field">
        <label htmlFor="new-user-role">תפקיד</label>
        <select id="new-user-role" name="role" defaultValue="employee">
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn primary" disabled={pending}>
        {pending ? "מוסיף..." : "הוספה"}
      </button>
    </form>
  );
}
