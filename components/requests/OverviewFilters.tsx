"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { OverviewRange } from "@/app/overview/range";

const RANGE_OPTIONS: { value: OverviewRange; label: string }[] = [
  { value: "30d", label: "30 הימים האחרונים" },
  { value: "month", label: "החודש הנוכחי" },
];

export default function OverviewFilters({
  isAdmin,
  profiles,
  selectedProfileId,
  range,
}: {
  isAdmin: boolean;
  profiles: { id: string; display_name: string }[];
  selectedProfileId: string;
  range: OverviewRange;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Every filter here re-navigates immediately on change instead of waiting
  // for a submit button — this is a Server Component page, so "live" means a
  // fresh request with the updated query param, not client-side state.
  // Replace, not push, so each filter change doesn't add its own history
  // entry (the back/gesture-back would otherwise just undo filter changes).
  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`/overview?${params.toString()}`);
  }

  return (
    <div className="overview-filters">
      {isAdmin && (
        <div className="field">
          <label htmlFor="employee">הצגת נתונים עבור</label>
          <select
            id="employee"
            value={selectedProfileId}
            onChange={(e) => updateParam("employee", e.target.value)}
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="type-pick">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={range === opt.value ? "sel vacation" : ""}
            onClick={() => updateParam("range", opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
