import AppHeader from "./AppHeader";
import BottomNav, { type ActiveScreen } from "./BottomNav";

export default function FetchErrorScreen({
  active,
}: {
  active: ActiveScreen;
}) {
  return (
    <div className="app-shell">
      <AppHeader showSettingsLink={active !== "settings"} />
      <div className="setup-notice">
        שגיאה בטעינת הנתונים מסופאבייס. נסו לרענן את העמוד; אם זה חוזר, בדקו
        את חיבור הרשת ואת מדיניות ה-RLS בפרויקט.
      </div>
      <BottomNav active={active} />
    </div>
  );
}
