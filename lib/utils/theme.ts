export const THEME_STORAGE_KEY = "mipo-theme";
export type ThemePreference = "light" | "dark" | "system";

// Mirrors --color-bg's light/dark values in app/globals.css — kept here
// too (duplicated, not imported) since both the inline <head> script below
// and the CSS need their own literal copy; the <meta name="theme-color">
// tag has no CSS-variable equivalent, so the OS status/nav bar color is
// never actually driven by background: var(--color-bg) and must be kept in
// sync by hand whenever those two values change.
export const LIGHT_THEME_COLOR = "#f5f6f8";
export const DARK_THEME_COLOR = "#15171c";

function resolvedIsDark(pref: ThemePreference): boolean {
  if (pref === "dark") return true;
  if (pref === "light") return false;
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/** Keeps the OS status/nav bar color (the <meta name="theme-color"> tag) in
 * sync with the app's actual background — called on every live theme
 * change from ThemeToggle. The initial-load case is handled separately by
 * THEME_INIT_SCRIPT, which runs before paint and can't import this. */
export function syncThemeColorMeta(pref: ThemePreference) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      resolvedIsDark(pref) ? DARK_THEME_COLOR : LIGHT_THEME_COLOR,
    );
  }
}

/** Runs inline in <head>, before paint, so there's no flash of the wrong
 * theme (or the wrong status/nav bar color) on load. Reads the explicit
 * choice from localStorage, if any, sets it on <html> — the CSS in
 * globals.css does the rest — and resolves + applies the matching
 * theme-color meta tag for both the explicit and "system" cases. */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var isDark;
    if (t === "light" || t === "dark") {
      document.documentElement.setAttribute("data-theme", t);
      isDark = t === "dark";
    } else {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", isDark ? ${JSON.stringify(DARK_THEME_COLOR)} : ${JSON.stringify(LIGHT_THEME_COLOR)});
    }
  } catch (e) {}
})();
`;
