---
sketch: 002
name: overview-dashboard
question: "What's the fastest way to see \"who's out today / this week\" without scanning the grid?"
winner: "B"
tags: [dashboard, overview]
---

# Sketch 002: Overview Dashboard

## Design Question
The week-grid table (sketch 001) is accurate but requires scanning. This sketch explores
a second screen whose only job is answering "who's out, right now / this week" in one
glance — the kind of thing you'd check before replying to your boss.

## How to View
```bash
node .claude/sketch-server.js
```
Then open `http://localhost:4173/.planning/sketches/002-overview-dashboard/index.html`

## Variants
- **A: Today Strip + Upcoming List** — a prominent "today" card up top (empty-state aware:
  "אין היעדרויות 🎉" when no one's out), then a chronological list grouped by day below.
  Closest to "read it like a feed."
- **B: Mini Calendar Heatmap** — a month-grid with a colored dot per leave type on days
  that have entries; tapping a day updates a detail panel underneath. Closest to "see
  the whole month's shape at once," trades immediacy for a tap-to-drill-down step.
- **C: Stat Cards + List** — four tappable stat cards (out today / this week, per type)
  that filter a flat list below. Closest to "totals first," good if the question is more
  often "how many" than "who."

All three share a bottom tab bar (טבלה / סקירה) hinting navigation back to the grid, and
the same "+" quick-add entry point as sketch 001.

## What to Look For
- Which answers "who's out today" fastest — A's card, B's today-highlighted cell, or C's count?
- B is the only one that shows the *whole* month's shape, not just the current week — is
  that worth the extra tap to see details?
- Does the stat-card framing in C feel more like a manager's dashboard, or overkill for
  a team this small?
