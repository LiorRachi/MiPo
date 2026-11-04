# MiPo (מי פה)

A personal leave-request tracker — replaces a manually-typed WhatsApp list. Hebrew,
right-to-left, mobile-first.

- **סקירה שבועית** (admin only) — a week-grid table: rows are leave types, columns are
  days, cells are color-coded name chips.
- **בקשות** — everyone's own requests (admins see everyone's), with a one-tap
  add-request flow and an approve/deny step for admins.
- **סיכום חודשי** — a month heatmap overview.
- **הגדרות** — theme, push-notification opt-in, account info, and (admin only) leave
  type management, user management, and an admin action audit log.

Installable as a PWA ("Add to Home Screen").

## Setup

1. **Environment variables:** copy `.env.example` to `.env.local` and fill in the
   values.
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Create the first admin account** (one-time — every account after this one is
   created from Settings → ניהול משתמשים in the app itself):
   ```bash
   node --env-file=.env.local scripts/create-admin.mjs you@example.com a-strong-password "Your Name"
   ```
4. **Run it:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and log in with the account
   from step 3.

Until the env vars are set, the app shows a setup notice instead of the grid.

### Push notifications (optional)

Generate a VAPID keypair and set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
and `VAPID_SUBJECT` in `.env.local` (see `.env.example`):

```bash
npx web-push generate-vapid-keys
```

Without these, the "הפעלת התראות" button in Settings shows an error instead of
subscribing, but everything else in the app works unaffected.

## Project structure

```
app/          routes (Server Components) + Server Actions (actions.ts files)
components/   auth/ calendar/ leave-types/ requests/ users/ shared/
lib/          auth/ leave/ utils/ hooks/ supabase/
```

`components/` and `lib/` are grouped by domain — a new leave-type component goes in
`components/leave-types/`, a new auth helper in `lib/auth/`, and so on.
`components/shared/` and `lib/utils/` are for things genuinely used across domains, not
a catch-all for anything uncertain.

## Testing

```bash
npm run test
```

Runs the Vitest suite (`lib/**/*.test.ts` and `app/**/*.test.ts`) — currently covers
the pure logic in `lib/leave/leave.ts` and `lib/leave/resolveEmployeeName.ts`, plus the
leave-request and user-creation Server Actions. Add a test alongside any new
non-trivial logic the same way. UI isn't covered here — verify that by hand in the
running app.

## Notes

- **Auth:** login only, no public signup — an admin creates every account (email,
  password, display name, role) from Settings → ניהול משתמשים. Every screen is gated
  behind login (see `middleware.ts`); only `admin`-role accounts can reach Settings'
  admin sections, and only admins can see the week grid or anyone's requests but their
  own.
- Leave types are managed from Settings → ניהול סוגי בקשות יציאה; each has a name,
  a color, and whether it applies on weekends / counts as a full day off.
  `lib/leave/leaveTypeColors.ts` is the source of truth for which colors exist.
- **Push notifications** (`lib/push/`): opt-in per device, enabled from Settings →
  "הפעלת התראות". Admins get pushed on every new request; the submitting employee
  gets pushed when their request is approved/denied. Sending is always best-effort — a
  missing VAPID config or a failed send never fails the action that triggered it.
  Requires the service worker at `public/sw.js` (also used for PWA installability via
  `public/manifest.json`).
- **Security hardening:**
  - Security headers + a baseline CSP are set in `next.config.ts` (CSP allows
    `'unsafe-inline'` for script/style, since Next's own hydration scripts are inline
    and there's no nonce-based setup — a stricter nonce-based CSP is a possible future
    upgrade).
  - Login lockout: 5 consecutive failed logins for an email locks it out for 15
    minutes, with the same generic error message either way, so a lockout can't be
    used to confirm an account exists.
  - Every admin action (user/leave-type create/update/delete) is recorded to an audit
    log, viewable from Settings → יומן פעולות מנהל.
  - **Known limitations, not yet addressed:** no MFA (a full TOTP enrollment/challenge
    flow is a larger separate feature); an admin-initiated password reset doesn't
    invalidate the target user's other active sessions.
