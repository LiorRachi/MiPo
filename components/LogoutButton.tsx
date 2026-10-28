import { logout } from "@/app/login/actions";

export default function LogoutButton() {
  return (
    <form action={logout} className="settings-standalone-row">
      <button type="submit" className="btn danger">
        התנתקות
      </button>
    </form>
  );
}
