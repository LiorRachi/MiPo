"use client";

import { useActionState, useRef, useState } from "react";
import { createUser, type UserActionState } from "@/app/settings/actions";
import { ROLE_OPTIONS } from "@/lib/auth/userRoles";
import AddEntityShell from "@/components/shared/AddEntityShell";
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

  return (
    <AddEntityShell
      open={open}
      onOpenChange={setOpen}
      toggleLabel="הוספת משתמש"
      title="הוספת משתמש"
      error={state.error}
      pending={pending}
      submitLabel="הוספה"
      pendingLabel="מוסיף..."
      formRef={formRef}
      formAction={formAction}
    >
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
    </AddEntityShell>
  );
}
