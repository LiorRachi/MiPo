import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";

export default function FetchErrorScreen({
  active,
}: {
  active: "table" | "overview";
}) {
  return (
    <div className="app-shell">
      <AppHeader />
      <div className="setup-notice">
        שגיאה בטעינת הנתונים מסופאבייס. נסו לרענן את העמוד; אם זה חוזר, בדקו
        את חיבור הרשת ואת מדיניות ה-RLS בפרויקט.
      </div>
      <BottomNav active={active} />
    </div>
  );
}
