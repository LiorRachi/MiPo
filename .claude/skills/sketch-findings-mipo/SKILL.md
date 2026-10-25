---
name: sketch-findings-mipo
description: Validated design decisions, CSS patterns, and visual direction from sketch experiments. Auto-loaded during UI implementation on MiPo.
---

<context>
## Project: MiPo (מי פה)

A personal leave-request tracker replacing a manually-maintained WhatsApp list. Clean,
utilitarian, data-dense feel — closer to a spreadsheet than a consumer app. Hebrew,
right-to-left. Mobile-first (Android phone is the primary device). Target stack:
Next.js + Supabase + Vercel, PWA ("Add to Home Screen"), single-user auth for v1.

Reference points: Google Sheets / Airtable (dense grid scanning), the plain WhatsApp
text list it replaces.

Sketch sessions wrapped: 2026-10-25
</context>

<design_direction>
## Overall Direction

Light neutral palette with one primary blue plus a dedicated color per leave type
(vacation = blue, medical referral = amber), squared-off radii, dense small-type
spacing, `system-ui` font stack (zero network dependency, renders Hebrew RTL cleanly).
Two core screens validated — a week-grid table (rows = leave types, columns = days,
cells = color-coded name chips) and a month heatmap overview — tied together with a
bottom tab bar and a single shared "add request" bottom-sheet flow reachable via a
floating "+" button from either screen.
</design_direction>

<findings_index>
## Design Areas

| Area | Reference | Key Decision |
|------|-----------|--------------|
| Theme & Visual System | references/theme-and-visual-system.md | Light/utilitarian palette, per-leave-type colors, RTL Hebrew, dense spacing |
| Week Grid Table | references/week-grid-table.md | Color-coded name chips (not avatars/plain text), sticky RTL label column |
| Overview Dashboard & Navigation | references/overview-dashboard-navigation.md | Month heatmap + tap-to-drill-down detail panel, bottom tab bar |
| Add-Request Flow | references/add-request-flow.md | FAB → bottom sheet → toast; type as colored toggle buttons |

## Theme

The winning theme file is at `sources/themes/default.css`.

## Source Files

Original sketch HTML files are preserved in `sources/` for complete reference — each
retains all variants (winner marked with ★) for context on what was rejected and why.
</findings_index>

<metadata>
## Processed Sketches

- 001-week-grid-table
- 002-overview-dashboard
</metadata>
