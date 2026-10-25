import AppHeader from "./AppHeader";
import BottomNav, { type ActiveScreen } from "./BottomNav";

export default function NotConfiguredScreen({
  active,
}: {
  active: ActiveScreen;
}) {
  return (
    <div className="app-shell">
      <AppHeader showSettingsLink={active !== "settings"} />
      <div className="setup-notice">
        Supabase עוד לא מחובר. הוסיפו <code>NEXT_PUBLIC_SUPABASE_URL</code> ו-
        <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> לקובץ <code>.env.local</code>,
        הריצו את <code>supabase/schema.sql</code> בעורך ה-SQL של הפרויקט, ואתחלו
        את השרת.
      </div>
      <BottomNav active={active} />
    </div>
  );
}
