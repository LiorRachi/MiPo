import type { ReactNode } from "react";

export default function SectionTitle({
  icon,
  tone,
  children,
}: {
  icon: ReactNode;
  tone?: "medical" | "other" | "teal" | "rose" | "vacation" | "green";
  children: ReactNode;
}) {
  return (
    <h2 className="section-title">
      <span className={`section-title-icon${tone ? ` ${tone}` : ""}`}>{icon}</span>
      {children}
    </h2>
  );
}
