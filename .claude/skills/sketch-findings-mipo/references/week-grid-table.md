# Week Grid Table (Core Screen)

## Design Decisions
This is MiPo's primary screen: rows = leave types, columns = the 7 days of the current
week, cells = the employee(s) on leave that day/type. Validated via sketch 001, **Variant
A (Color Chips) won** over avatar-facepiles and plain text stacks.

- **Cell content:** each name renders as a small tinted pill ("chip") — background and
  text color come from the leave type's palette (see theme-and-visual-system.md), not a
  generic neutral style. This was chosen over initials-only avatars (Variant B) because
  reading an actual first name beat decoding a 2-letter initial, and over plain text
  (Variant C) because the tinted background makes the leave type scannable at a glance
  without reading the row label.
- **Multiple people, same day:** chips stack **vertically** within the cell; the cell
  (and row) grows taller rather than wrapping chips horizontally or overlapping them.
- **Column width:** ~46px per day column on a 375px viewport, with the row-label column
  fixed at ~78px and `position: sticky; right: 0` (RTL — sticky side is the right, not
  left). The grid area outside the sticky column scrolls horizontally if needed.
- **Row label:** leave-type name + a small colored dot matching its chip color, right-aligned.
- **Header row:** each day column shows the Hebrew weekday letter (א/ב/ג...) above the day
  number; today's number gets a filled circle in the primary color.
- **Legend row:** a compact row under the week-nav listing each active leave type with its
  dot — reinforces the color coding before the user even looks at the grid.
- **Extensibility affordance:** a trailing "+ הוסף סוג" (add type) row at the bottom of the
  table, styled muted/faint, hints that leave-type rows are meant to grow over time (the
  user only has 2 types now — חופשה שנתית, הפניה רפואית — but said more are coming).
- **Week navigation:** `‹` / `›` buttons flank a date-range label ("25–31 באוק׳") with a
  "השבוע" (this week) pill when viewing the current week.
- **Quick add:** a floating "+" button (bottom-left — mirrored FAB position for RTL) opens
  a bottom sheet with: employee select, leave-type toggle buttons (colored per type, same
  palette as chips), start date, end date, cancel/save. Save closes the sheet and shows a
  toast ("נשמר בהצלחה ✓"). This is the core flow that replaces manually typing a WhatsApp
  message.

## CSS Patterns
```css
.label-col {
  width: 78px; min-width: 78px; position: sticky; right: 0; z-index: 2;
  background: var(--color-surface); border-left: 1px solid var(--color-border);
}
.chip {
  font-size: 10.5px; font-weight: 600; text-align: center; padding: 3px 2px;
  border-radius: var(--radius-sm); cursor: pointer;
}
.chip.vacation { background: var(--leave-vacation-bg); color: var(--leave-vacation); }
.chip.medical { background: var(--leave-medical-bg); color: var(--leave-medical); }
.cell-stack { display: flex; flex-direction: column; gap: 3px; }
```

## HTML Structures
See `sources/001-week-grid-table/index.html`, Variant A block (`#variant-a`) for the full
table markup, the add-request bottom sheet, and the FAB. The table uses a plain
`<table class="grid">` with `table-layout: fixed` — not a CSS grid — specifically so the
sticky label column works reliably with horizontal scroll on mobile Safari/Chrome.

## What to Avoid
- **Avatars/initials (Variant B)** — tested and rejected as the primary pattern. Facepile
  overlap packs tighter, but hides the actual name behind a tap; for a tool whose whole
  point is "see who's out," that's the wrong tradeoff. (Still available as a reference if
  a denser view is ever needed for a much bigger team.)
- **Plain text stack (Variant C)** — rejected as the primary pattern; too close to a raw
  spreadsheet, loses the at-a-glance type coloring that the legend sets up.
- Don't let the day-column width grow past what 7 columns + the label column need on a
  375px screen — the sticky-column + horizontal-scroll pattern exists specifically to
  avoid needing wider columns.

## Origin
Synthesized from sketches: 001 (Variant A)
Source files available in: `sources/001-week-grid-table/`
