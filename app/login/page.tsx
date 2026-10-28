import AppHeader from "@/components/AppHeader";
import LoginForm from "@/components/LoginForm";
import { supabaseConfigured } from "@/lib/supabase/server";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="app-shell">
      <AppHeader showSettingsLink={false} />
      {supabaseConfigured ? (
        <LoginForm next={sp.next ?? "/"} />
      ) : (
        <div className="setup-notice">
          Supabase עוד לא מחובר. הוסיפו <code>NEXT_PUBLIC_SUPABASE_URL</code> ו-
          <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> לקובץ{" "}
          <code>.env.local</code>, הריצו את <code>supabase/schema.sql</code>{" "}
          בעורך ה-SQL של הפרויקט, ואתחלו את השרת.
        </div>
      )}
    </div>
  );
}
