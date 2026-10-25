# Sketch Wrap-Up Summary

**Date:** 2026-10-25
**Sketches processed:** 2
**Design areas:** Theme & Visual System, Week Grid Table, Overview Dashboard & Navigation, Add-Request Flow
**Skill output:** `./.claude/skills/sketch-findings-mipo/`

## Included Sketches
| # | Name | Winner | Design Area |
|---|------|--------|-------------|
| 001 | week-grid-table | A — Color Chips | Week Grid Table, Add-Request Flow |
| 002 | overview-dashboard | B — Mini Calendar Heatmap | Overview Dashboard & Navigation |

## Excluded Sketches
| # | Name | Reason |
|---|------|--------|
| — | — | none |

## Design Direction
Clean, utilitarian, data-dense — closer to a spreadsheet than a consumer app. Hebrew
RTL, mobile-first. Light neutral palette + one primary blue + a dedicated color per
leave type (vacation = blue, medical referral = amber). Squared radii, dense type/spacing,
`system-ui` font (no network dependency).

## Key Decisions
- **Layout:** two core screens — a week-grid table (rows = leave types, columns = days)
  and a month-heatmap overview — connected by a bottom tab bar.
- **Palette:** per-leave-type colors used consistently as chip/dot/tag colors across both
  screens, not just the grid.
- **Core interaction:** color-coded name chips in the grid (beat avatar-facepiles and
  plain text); tap-a-day drill-down in the overview (beat a feed list and a stats-first
  dashboard).
- **Add-request:** single shared FAB → bottom-sheet form → toast flow, reachable from
  either screen.
- **Extensibility:** the grid includes a visible "+ הוסף סוג" affordance since the user
  only confirmed 2 leave types for now (חופשה שנתית, הפניה רפואית) but expects to add more.
