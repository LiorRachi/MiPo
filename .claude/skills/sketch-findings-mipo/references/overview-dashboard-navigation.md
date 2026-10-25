# Overview Dashboard & Navigation

## Design Decisions
A second screen answering "who's out, right now / this week" faster than scanning the
full grid. Validated via sketch 002, **Variant B (Mini Calendar Heatmap) won** over a
today-card+list feed and a stat-cards+list layout.

- **Layout:** a month-grid calendar (7 columns, Hebrew weekday headers א–ש) where any day
  with leave requests shows a small colored dot per entry (reusing the exact leave-type
  colors from the week grid — one visual language across both screens). Days outside the
  current month are muted; today's cell gets a primary-color outline.
- **Drill-down:** tapping a day does **not** navigate away — it updates a "day detail"
  panel directly below the calendar with that day's full entries (name + type tag). This
  keeps the user in one view instead of pushing a new screen for every day they check.
- **Why this won over the alternatives:** the today-card+list (Variant A) only showed the
  current week, not the whole month's shape; the stat-cards (Variant C) led with counts
  ("3 out this week") which felt like a manager-dashboard framing the user didn't ask
  for — they want to see *who*, not just *how many*.
- **Screen-to-screen navigation:** a bottom tab bar with two destinations — "טבלה" (table,
  → sketch 001's grid) and "סקירה" (overview, this screen) — icon + label, active tab in
  the primary color. This is the first concrete navigation pattern validated for the app;
  carry it forward as the real nav structure (bottom tabs, not a hamburger/drawer).
- **Consistency with the grid screen:** same app header, same "+" FAB/add-request entry
  point, same leave-type legend/dot language.

## CSS Patterns
```css
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.cal-cell {
  aspect-ratio: 1; border-radius: var(--radius-sm); background: var(--color-surface-alt);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; border: 1px solid transparent;
}
.cal-cell.today { border-color: var(--color-primary); color: var(--color-primary); }
.cal-cell .dots { display: flex; gap: 2px; margin-top: 2px; }

.tabbar { display: flex; border-top: 1px solid var(--color-border); background: var(--color-surface); }
.tabbar .tb.active { color: var(--color-primary); font-weight: 700; }
```

## HTML Structures
See `sources/002-overview-dashboard/index.html`, Variant B block (`#variant-b`) for the
calendar grid, the `showDay()` JS pattern driving the detail panel, and the shared
`.tabbar` markup (reused verbatim from Variant A/C in the same file).

## What to Avoid
- **Today-card + chronological list (Variant A)** — rejected as the *primary* overview,
  but the empty-state copy pattern it introduced ("אין היעדרויות 🎉" for a day/range with
  nobody out) is worth keeping anywhere a list can be empty.
- **Stat-cards-first framing (Variant C)** — rejected; leading with counts over names felt
  like overkill for a team this small. Don't resurrect a stats-first dashboard unless the
  team size changes meaningfully.
- Don't replace the bottom tab bar with a different nav pattern (drawer, top tabs) without
  re-validating — it was chosen specifically to keep both core screens one tap apart.

## Origin
Synthesized from sketches: 002 (Variant B)
Source files available in: `sources/002-overview-dashboard/`
