"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY, syncThemeColorMeta, type ThemePreference } from "@/lib/utils/theme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "בהיר" },
  { value: "dark", label: "כהה" },
  { value: "system", label: "אוטומטי" },
];

function applyTheme(pref: ThemePreference) {
  if (pref === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", pref);
  }
  syncThemeColorMeta(pref);
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getSnapshot(): ThemePreference {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

function getServerSnapshot(): ThemePreference {
  return "system";
}

export default function ThemeToggle() {
  const pref = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function choose(next: ThemePreference) {
    if (next === "system") {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    }
    applyTheme(next);
    // Same-tab localStorage writes don't fire the native "storage" event
    // (only other tabs get that) — dispatch one ourselves so
    // useSyncExternalStore notices and re-reads getSnapshot().
    window.dispatchEvent(new Event("storage"));
  }

  return (
    <div className="settings-row settings-standalone-row">
      <div className="field">
        <label>מצב תצוגה</label>
        <div className="theme-pick">
          {OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              className={pref === opt.value ? "sel" : ""}
              onClick={() => choose(opt.value)}
              aria-pressed={pref === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
