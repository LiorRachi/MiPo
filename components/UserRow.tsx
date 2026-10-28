"use client";

import { useActionState, useState } from "react";
import {
  deleteUser,
  updateUser,
  type UserActionState,
} from "@/app/settings/actions";
import type { Profile } from "@/lib/users";

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
  const [showPassword, setShowPassword] = useState(false);

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
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="סיסמה חדשה (השאירו ריק כדי לא לשנות)"
            className="settings-label-input"
            aria-label="סיסמה חדשה"
            autoComplete="off"
          />
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "הסתרת סיסמה" : "הצגת סיסמה"}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>
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
                <option value="employee">עובד/ת</option>
                <option value="admin">מנהל/ת</option>
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
              <option value="employee">עובד/ת</option>
              <option value="admin">מנהל/ת</option>
            </select>
          )}
          <div className="settings-row-actions">
            <button
              type="submit"
              className="btn ghost icon"
              disabled={updatePending}
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
            {!isSelf && (
              <button
                type="submit"
                form={`delete-user-${user.id}`}
                className="btn danger icon"
                disabled={deletePending}
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
