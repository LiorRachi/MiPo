import Link from "next/link";

export type ActiveScreen = "table" | "overview" | "settings";

export default function BottomNav({ active }: { active: ActiveScreen }) {
  return (
    <nav className="tabbar">
      <Link href="/" className={active === "table" ? "active" : ""}>
        <span className="ic">▦</span>
        טבלה
      </Link>
      <Link href="/overview" className={active === "overview" ? "active" : ""}>
        <span className="ic">◉</span>
        סקירה
      </Link>
    </nav>
  );
}
