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
        {show ? (
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
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
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
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
