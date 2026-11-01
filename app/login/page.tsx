import LoginForm from "@/components/auth/LoginForm";
import Logo from "@/components/shared/Logo";
import { supabaseConfigured } from "@/lib/supabase/server";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="app-shell login-page">
      <div className="login-brand">
        <Logo size={44} />
        <div className="login-brand-text">
          MiPo <small>מי פה</small>
        </div>
      </div>
      {supabaseConfigured ? (
        <LoginForm next={sp.next ?? "/"} />
      ) : (
        <div className="setup-notice">
          Supabase עוד לא מחובר. הוסיפו <code>NEXT_PUBLIC_SUPABASE_URL</code> ו-
          <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> לקובץ{" "}
          <code>.env.local</code>, הריצו <code>npm run db:push</code>{" "}
          כדי להחיל את ה-migrations, ואתחלו את השרת.
        </div>
      )}
    </div>
  );
}
