export const THEME_STORAGE_KEY = "mipo-theme";
export type ThemePreference = "light" | "dark" | "system";

/** Runs inline in <head>, before paint, so there's no flash of the wrong
 * theme on load. Reads the explicit choice from localStorage, if any, and
 * sets it on <html> — the CSS in globals.css does the rest. No-op (stays on
 * the media-query-driven default) when the user has never chosen, i.e.
 * "system". */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (t === "light" || t === "dark") {
      document.documentElement.setAttribute("data-theme", t);
    }
  } catch (e) {}
})();
`;
