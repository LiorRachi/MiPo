import Link from "next/link";

export type ActiveScreen = "table" | "requests" | "settings";

export default function BottomNav({ active }: { active: ActiveScreen }) {
  return (
    <nav className="tabbar">
      <Link href="/" className={active === "table" ? "active" : ""}>
        <span className="ic">▦</span>
        לוח
      </Link>
      <Link href="/requests" className={active === "requests" ? "active" : ""}>
        <span className="ic">◉</span>
        בקשות
      </Link>
    </nav>
  );
}
