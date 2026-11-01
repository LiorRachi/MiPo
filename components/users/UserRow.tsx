"use client";

import { useActionState } from "react";
import {
  deleteUser,
  updateUser,
  type UserActionState,
} from "@/app/settings/actions";
import type { Profile } from "@/lib/auth/users";
import { ROLE_OPTIONS } from "@/lib/auth/userRoles";
import PasswordField from "./PasswordField";
import { DeleteRowButton, SaveRowButton } from "@/components/shared/RowActionButtons";

const initialState: UserActionState = {};

export default function UserRow({
  user,
  isSelf,
}: {
  user: Profile;
  isSelf: boolean;
}) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateUser,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteUser,
    initialState,
  );

  return (
    <div className="settings-row">
      <form action={updateAction} className="settings-row-form">
        <input type="hidden" name="id" value={user.id} />
        <input
          type="text"
          name="display_name"
          defaultValue={user.display_name}
          className="settings-label-input"
          aria-label="שם"
        />
        <div className="user-email">{user.email}</div>
        <PasswordField
          name="password"
          placeholder="סיסמה חדשה (השאירו ריק כדי לא לשנות)"
          className="settings-label-input"
          ariaLabel="סיסמה חדשה"
        />
        <div className="settings-row-bottom">
          {isSelf ? (
            // Disabled selects aren't included in form submission, so the
            // real value still has to travel via a hidden input — otherwise
            // saving your own row would fail with "invalid role" on every
            // edit, not just block the role change this is meant to prevent.
            <>
              <select
                className="role-select"
                defaultValue={user.role}
                disabled
                aria-label="תפקיד"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input type="hidden" name="role" value={user.role} />
            </>
          ) : (
            <select
              name="role"
              defaultValue={user.role}
              className="role-select"
              aria-label="תפקיד"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          <div className="settings-row-actions">
            <SaveRowButton disabled={updatePending} />
            {!isSelf && (
              <DeleteRowButton
                form={`delete-user-${user.id}`}
                disabled={deletePending}
              />
            )}
          </div>
        </div>
      </form>
      {!isSelf && (
        <form id={`delete-user-${user.id}`} action={deleteAction} hidden>
          <input type="hidden" name="id" value={user.id} />
        </form>
      )}
      {updateState.error && <div className="form-error">{updateState.error}</div>}
      {deleteState.error && <div className="form-error">{deleteState.error}</div>}
    </div>
  );
}
