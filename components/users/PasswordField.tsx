"use client";

import { useState } from "react";

export default function PasswordField({
  id,
  name,
  defaultValue,
  placeholder,
  required,
  minLength,
  className,
  ariaLabel,
}: {
  id?: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  className?: string;
  ariaLabel?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="password-field">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className={className}
        aria-label={ariaLabel}
        autoComplete="off"
      />
      <button
        type="button"
        className="icon-btn"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "הסתרת סיסמה" : "הצגת סיסמה"}
      >
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}
