"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="login-card">
      <h3>התחברות</h3>
      {state.error && <div className="form-error">{state.error}</div>}
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="login-email">אימייל</label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="username"
        />
      </div>
      <div className="field">
        <label htmlFor="login-password">סיסמה</label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      <button type="submit" className="btn primary" disabled={pending}>
        {pending ? "מתחבר..." : "התחברות"}
      </button>
    </form>
  );
}
