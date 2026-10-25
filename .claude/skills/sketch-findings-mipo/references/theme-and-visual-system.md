# Theme & Visual System

## Design Decisions
MiPo is clean and utilitarian — closer to a spreadsheet than a consumer app, since its
job is dense data-scanning (who's out, when). Validated across both sketches:

- **Palette:** light neutral grays (`--color-bg: #f5f6f8`, `--color-surface: #ffffff`) with
  one primary blue (`#2f6fed`) for nav/actions, plus a dedicated color per leave type so
  the type is recognizable without reading text:
  - חופשה שנתית (vacation) → blue `#2f6fed` / bg `#eaf1ff`
  - הפניה רפואית (medical referral) → amber `#d97706` / bg `#fef3e2`
  - Reserved slot for a third type → violet `#7c4dff` / bg `#f1ecff` (not yet used, but
    themed ahead of time since the user said more leave types are coming)
- **Typography:** `system-ui` stack with Hebrew fallback (`Noto Sans Hebrew`) — renders
  RTL Hebrew correctly with zero network dependency (important since the app has no
  guaranteed hosting/connectivity assumptions baked in from day one).
- **Shapes:** squared-off radii (6–14px), not pill-heavy except for chips/tags — reinforces
  the utilitarian feel over a "friendly consumer app" feel.
- **Direction:** `dir="rtl" lang="he"` on `<html>`. The sticky/anchored UI column (e.g. the
  grid's row-label column) sits on the **right**, matching RTL reading order — the opposite
  of where it would go in an LTR app.
- **Density:** small type sizes (11–13px body) and tight spacing (4–12px) throughout —
  this is a deliberate choice for a data-dense grid on a phone screen, not an oversight.

## CSS Patterns
Full token set lives in `sources/themes/default.css` — link it from any new page:
```html
<link rel="stylesheet" href="path/to/default.css">
```
Key variables to reuse: `--color-primary`, `--leave-vacation` / `--leave-vacation-bg`,
`--leave-medical` / `--leave-medical-bg`, `--radius-sm/md/lg`, `--space-1..8`,
`--font-sans`.

## HTML Structures
Every screen sketched so far uses the same phone-frame + app-header shell:
```html
<div class="app-header">
  <div class="app-title">MiPo <small>מי פה</small></div>
  <div class="icon-btn">⚙</div>
</div>
```
Carry this header forward as the real app's top bar.

## What to Avoid
- Don't introduce a second accent color outside the leave-type palette — color is reserved
  for distinguishing leave types, not for general decoration.
- Don't loosen the spacing/type scale "for readability" — density was a deliberate choice
  validated against the grid's narrow day-columns (see week-grid-table.md).

## Origin
Synthesized from sketches: 001, 002
Source files available in: `sources/001-week-grid-table/`, `sources/002-overview-dashboard/`, `sources/themes/`
