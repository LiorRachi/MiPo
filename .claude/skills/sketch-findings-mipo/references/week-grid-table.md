# Week Grid Table (Core Screen)

## Design Decisions
This is MiPo's primary screen: rows = leave types, columns = the 7 days of the current
week, cells = the employee(s) on leave that day/type. Validated via sketch 001, **Variant
A (Color Chips) won** over avatar-facepiles and plain text stacks.

> **Revised during implementation (2026-10-25):** the sticky row-label column described
> below was removed to give the 7 day columns more width on a phone screen, and chips now
> wrap (row + `flex-wrap`) instead of only stacking vertically. The sketch's validated
> choice of *color chips* (vs. avatars/plain text) still stands — only the row-label and
> stacking details below are now historical. See CSS Patterns for what's actually shipped.

- **Cell content:** each name renders as a small tinted pill ("chip") — background and
  text color come from the leave type's palette (see theme-and-visual-system.md), not a
  generic neutral style. This was chosen over initials-only avatars (Variant B) because
  reading an actual first name beat decoding a 2-letter initial, and over plain text
  (Variant C) because the tinted background makes the leave type scannable at a glance
  without reading the row label.
- **Multiple people, same day:** chips now wrap — `flex-direction: row; flex-wrap: wrap`
  — rather than only stacking vertically as originally sketched; the cell still grows
  taller when wrapping is needed. In practice, with ~60px-wide columns and typical 4-5
  character Hebrew names, two chips rarely both fit on one line — most cells still read
  as one name per line, wrapping is just no longer artificially prevented.
- **Row identity (no label column):** the original sticky row-label column (leave-type
  name + dot, ~78px fixed width) was removed so the 7 day columns can split the full
  width evenly. Row identity now comes from the legend above the grid plus each row's
  position matching legend order, reinforced by `role="row" aria-label={lt.label_he}` on
  each row and `aria-label` on every cell (for assistive tech, since there's no visible
  label — see app/page.tsx). No sticky positioning or horizontal scroll is needed anymore;
  the grid is a CSS Grid of 7 equal (`1fr`) columns, not a `<table>`.
- **Header row:** each day column shows the Hebrew weekday letter (א/ב/ג...) above the day
  number; today's number gets a filled circle in the primary color.
- **Legend row:** a compact row under the week-nav listing each active leave type with its
  dot — this is now the *only* place row identity is shown visually, reinforcing the color
  coding before the user looks at the grid.
- **Extensibility affordance:** a trailing "+ הוסף סוג" (add type) row at the bottom of the
  table, styled muted/faint, hints that leave-type rows are meant to grow over time (the
  user only has 2 types now — חופשה שנתית, הפניה רפואית — but said more are coming). Not
  yet implemented in the real app (still sketch-only).
- **Week navigation:** `‹` / `›` buttons flank a date-range label ("25–31 באוק׳") with a
  "השבוע" (this week) pill when viewing the current week.
- **Quick add:** a floating "+" button (bottom-left — mirrored FAB position for RTL) opens
  a bottom sheet with: employee select, leave-type toggle buttons (colored per type, same
  palette as chips), start date, end date, cancel/save. Save closes the sheet and shows a
  toast ("נשמר בהצלחה ✓"). This is the core flow that replaces manually typing a WhatsApp
  message.

## CSS Patterns
As actually shipped (app/globals.css) — a CSS Grid, not a `<table>`, no label column:
```css
.grid { display: grid; grid-template-columns: repeat(7, 1fr); }
.day-cell { padding: 4px; min-height: 54px; background: var(--color-surface); }
.day-cell.alt { background: var(--color-surface-alt); }
.cell-stack {
  display: flex; flex-direction: row; flex-wrap: wrap;
  justify-content: center; align-items: center; gap: 3px;
}
.chip {
  font-size: 10.5px; font-weight: 600; text-align: center; padding: 3px 6px;
  border-radius: var(--radius-sm); max-width: 100%; min-width: 0;
}
.chip.vacation { background: var(--leave-vacation-bg); color: var(--leave-vacation); }
.chip.medical { background: var(--leave-medical-bg); color: var(--leave-medical); }
```
The original sketch's `.label-col` (sticky, 78px, `position: sticky; right: 0`) no longer
exists anywhere in the codebase.

## HTML Structures
See `sources/001-week-grid-table/index.html`, Variant A block (`#variant-a`) for the
original sketch markup (add-request bottom sheet and FAB are still accurate there). For
the real implementation, see `app/page.tsx` — plain `<div role="table">`/`role="row"`/
`role="columnheader"`/`role="cell"` (CSS Grid, not an HTML `<table>`), with `aria-label`
on each row/cell carrying the row-identity information the removed label column used to
convey visually.

## What to Avoid
- **Avatars/initials (Variant B)** — tested and rejected as the primary pattern. Facepile
  overlap packs tighter, but hides the actual name behind a tap; for a tool whose whole
  point is "see who's out," that's the wrong tradeoff. (Still available as a reference if
  a denser view is ever needed for a much bigger team.)
- **Plain text stack (Variant C)** — rejected as the primary pattern; too close to a raw
  spreadsheet, loses the at-a-glance type coloring that the legend sets up.
- Don't add a label column back without also re-adding its accessibility value (row
  `aria-label`s) if removing it again for any reason — the plain CSS Grid + `aria-label`
  approach is what makes the label-less layout viable at all.

## Origin
Synthesized from sketches: 001 (Variant A)
Source files available in: `sources/001-week-grid-table/`
Revised against the shipped implementation: 2026-10-25 (post-build code review)
