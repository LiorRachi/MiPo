---
sketch: 001
name: week-grid-table
question: "How do multiple employee names pack into one day/type cell without feeling cramped?"
winner: "A"
tags: [layout, core-table, rtl]
---

# Sketch 001: Week Grid Table

## Design Question
MiPo's core screen is a table: rows = leave types, columns = days of the week, cells =
the employee(s) on leave that day. On a 375px phone with 7 day-columns + a label column,
each cell is only ~46px wide. How should a cell render one name, and how should it render
two or more names on the same day, without the grid turning into mush?

## How to View
Start the local static server (resolves the shared `../themes/default.css` and lets the
JS interactions run — opening the file directly via `file://` renders a flat snapshot with
no styling):

```bash
node .claude/sketch-server.js
```

Then open `http://localhost:4173/.planning/sketches/001-week-grid-table/index.html`

## Variants
- **A: Color Chips** — each name is a small tinted pill (blue for חופשה שנתית, amber for
  הפניה רפואית). Multiple people on the same day stack as separate pills, cell grows taller.
- **B: Avatars** — 2-letter initials in a colored circle; multiple people overlap into a
  small "facepile" instead of growing the cell. Tap an avatar for a name popover.
- **C: Compact Text Stack** — plain name text with a thin colored accent border, no chip
  background. Closest to a real spreadsheet; most names fit per pixel, least visually loud.

All three variants share the same header, week navigator ("‹ השבוע ›"), leave-type legend,
and the "+" FAB that opens a bottom-sheet form for adding a request (employee, type,
date range) — try it, it has a working save → toast flow. There's also a greyed "+ הוסף
סוג" row under the table hinting that leave-type rows are meant to be extended later.

## What to Look For
- Does the multi-person day (Wed 28/10: איתי + דנה) stay legible in each variant?
- Which feels closest to "glance and know who's out" vs. needing a tap to find out?
- Facepile (B) packs tightest but hides names until tapped — is that an acceptable tradeoff?
- Does the sticky right-hand label column (RTL — today's date column sits nearest the
  label) feel natural, or confusing?
