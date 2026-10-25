# Add-Request Flow

## Design Decisions
The core action that replaces the manual WhatsApp message: logging a new leave request.
Fully designed and validated in sketch 001 (Variant A); referenced/stubbed in sketch 002
as the same entry point reused across screens.

- **Entry point:** a circular "+" FAB fixed to the bottom-left of the phone frame (RTL —
  this is the mirrored position from where an LTR app's FAB would sit). Present on every
  screen (grid and overview) so adding a request is never more than one tap away.
- **Pattern:** tapping "+" opens a **bottom sheet** (slide up from the bottom, dark
  backdrop, tap-outside-to-dismiss) rather than a full-screen page or a top-anchored modal
  — keeps the user's thumb near the action on a one-handed phone grip.
- **Form fields, in order:**
  1. עובד/ת (employee) — a select/dropdown
  2. סוג חופשה (leave type) — toggle buttons (not a dropdown), one per active leave type,
     colored using that type's palette when selected — makes the choice visually
     consistent with how it'll render as a chip afterward
  3. מתאריך / עד תאריך (start date / end date) — native date inputs, defaulting to today
  4. Cancel / Save buttons, Save styled primary (filled blue), Cancel ghost (outlined)
- **Feedback loop:** Save closes the sheet, then (slight delay) shows a toast —
  "נשמר בהצלחה ✓" (saved successfully). The delay avoids the toast appearing to fire
  "through" the closing sheet.

## CSS Patterns
```css
.sheet-backdrop {
  position: absolute; inset: 0; background: rgba(20,20,30,.4);
  opacity: 0; pointer-events: none; transition: opacity .18s ease;
}
.sheet-backdrop.show { opacity: 1; pointer-events: auto; }
.sheet {
  position: absolute; left: 0; right: 0; bottom: 0; background: var(--color-surface);
  border-radius: 18px 18px 0 0; padding: 18px; transform: translateY(100%);
  transition: transform .22s ease;
}
.sheet-backdrop.show .sheet { transform: translateY(0); }

.type-pick button.sel.vacation { border-color: var(--leave-vacation); color: var(--leave-vacation); background: var(--leave-vacation-bg); }
```

## HTML Structures
Full working markup + JS (`openSheet`, `closeSheet`, `pickType`, `saveSheet`, toast) is in
`sources/001-week-grid-table/index.html`. Treat it as the reference implementation for
this flow — it's the most complete/interactive piece sketched so far.

## What to Avoid
- Don't move this to a full-screen route — the bottom-sheet pattern was specifically
  chosen to keep it lightweight for a single-user, high-frequency action.
- Don't make leave-type a dropdown — the toggle-button pattern doubles as a live preview
  of the chip color the entry will get in the grid.

## Origin
Synthesized from sketches: 001 (Variant A), referenced in 002
Source files available in: `sources/001-week-grid-table/`
