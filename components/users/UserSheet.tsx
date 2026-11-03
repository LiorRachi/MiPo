"use client";

import { useActionState, useState } from "react";
import {
  createUser,
  deleteUser,
  updateUser,
  type UserActionState,
} from "@/app/settings/actions";
import type { Profile } from "@/lib/auth/users";
import { ROLE_OPTIONS } from "@/lib/auth/userRoles";
import Sheet from "@/components/shared/Sheet";
import PasswordField from "./PasswordField";

const initialState: UserActionState = {};

// One sheet for both add and edit, mirroring LeaveTypeSheet/RequestSheet's
// mode="add"|"edit" split.
const UserSheetForm = ({
  mode,
  onClose,
  onSuccess,
  user,
  isSelf,
}: {
  mode: "add" | "edit";
  onClose: () => void;
  onSuccess?: () => void;
  user?: Profile;
  isSelf: boolean;
}) => {
  const [state, formAction, pending] = useActionState(
    async (prevState: UserActionState, formData: FormData) => {
      const action = mode === "add" ? createUser : updateUser;
      const result = await action(prevState, formData);
      if (result.ok) onSuccess?.();
      return result;
    },
    initialState,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(deleteUser, initialState);
  // Adjusting state during render (not in an effect) when deleteState
  // changes identity, per https://react.dev/learn/you-might-not-need-an-effect.
  const [prevDeleteState, setPrevDeleteState] = useState(deleteState);
  if (deleteState !== prevDeleteState) {
    setPrevDeleteState(deleteState);
    if (deleteState.ok) onClose();
  }

  const deleteFormId = `delete-user-${user?.id ?? "new"}`;
  const canDelete = mode === "edit" && !isSelf;

  return (
    <>
      <h3>{mode === "add" ? "הוספת משתמש" : "עריכת משתמש"}</h3>
      {state.error && <div className="form-error">{state.error}</div>}
      {deleteState.error && <div className="form-error">{deleteState.error}</div>}
      <form action={formAction}>
        {mode === "edit" && <input type="hidden" name="id" value={user!.id} />}
        <div className="field">
          <label htmlFor="user-name">שם</label>
          <input
            id="user-name"
            name="display_name"
            type="text"
            defaultValue={user?.display_name}
            required
            autoFocus
          />
        </div>
        {mode === "add" ? (
          <div className="field">
            <label htmlFor="user-email">אימייל</label>
            <input id="user-email" name="email" type="email" required />
          </div>
        ) : (
          <div className="field">
            <label>אימייל</label>
            <div className="static-value">{user!.email}</div>
          </div>
        )}
        <div className="field">
          <label htmlFor="user-password">{mode === "add" ? "סיסמה" : "סיסמה חדשה"}</label>
          <PasswordField
            id="user-password"
            name="password"
            required={mode === "add"}
            minLength={8}
            placeholder={mode === "edit" ? "השאירו ריק כדי לא לשנות" : undefined}
          />
        </div>
        {isSelf ? (
          // Disabled selects aren't included in form submission, so the
          // real value still has to travel via a hidden input — otherwise
          // saving your own row would fail with "invalid role" on every
          // edit, not just block the role change this is meant to prevent.
          <>
            <div className="field">
              <label>תפקיד</label>
              <div className="static-value">
                {ROLE_OPTIONS.find((o) => o.value === user?.role)?.label}
              </div>
            </div>
            <input type="hidden" name="role" value={user?.role} />
          </>
        ) : (
          <div className="field">
            <label htmlFor="user-role">תפקיד</label>
            <select id="user-role" name="role" defaultValue={user?.role ?? "employee"}>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="sheet-actions">
          {canDelete ? (
            <button
              type="submit"
              form={deleteFormId}
              className="btn danger"
              disabled={deletePending || pending}
            >
              מחיקה
            </button>
          ) : (
            <button type="button" className="btn ghost" onClick={onClose}>
              ביטול
            </button>
          )}
          <button type="submit" className="btn primary" disabled={pending || deletePending}>
            {pending ? "שומר..." : "שמירה"}
          </button>
        </div>
      </form>
      {canDelete && (
        <form id={deleteFormId} action={deleteAction} hidden>
          <input type="hidden" name="id" value={user!.id} />
        </form>
      )}
    </>
  );
};

export default function UserSheet({
  mode,
  open,
  onClose,
  onSuccess,
  user,
  isSelf,
}: {
  mode: "add" | "edit";
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user?: Profile;
  isSelf?: boolean;
}) {
  return (
    <Sheet open={open} onClose={onClose}>
      {open && (
        <UserSheetForm
          mode={mode}
          onClose={onClose}
          onSuccess={onSuccess}
          user={user}
          isSelf={Boolean(isSelf)}
        />
      )}
    </Sheet>
  );
}
