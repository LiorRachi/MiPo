# MiPo (מי פה)

A personal leave-request tracker — replaces a manually-typed WhatsApp list with a
week-grid table (rows = leave types, columns = days) and a one-tap add-request flow.
See [`.claude/skills/sketch-findings-mipo/`](.claude/skills/sketch-findings-mipo/SKILL.md)
for the validated design decisions this implements.

## Setup

1. **Supabase project:** create one at [supabase.com](https://supabase.com) (free
   tier).
2. **Disable public signup:** in the Supabase dashboard, go to Authentication →
   Sign In / Providers → Email, and turn **off** "Allow new users to sign up".
   There's no sign-up screen in the app either way, but this closes the
   underlying Auth API too — accounts are created only by an admin, from
   Settings (or the bootstrap script below).
3. **Environment variables:** `.env.local` should point at the **dev** project
   (MiPo-dev), not prod — see [Dev vs. prod database](#dev-vs-prod-database) below.
   Create a `.env.local` file in the project root with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   SUPABASE_SECRET_KEY=your-secret-key
   ```
   Get the first two from **Connect** near the top of your Supabase project
   dashboard (older projects may call the second one the **anon public** key
   under Settings → API — same thing). Get the secret key from
   Settings → API → **secret key** (older projects may call this the
   **service_role** key instead — same thing, just the pre-2026 name). That
   last one must stay server-only — note it has no `NEXT_PUBLIC_` prefix, unlike the other two,
   so Next.js never bundles it into client-side JS. `.env.local` is
   gitignored; never commit any of these.
4. **Install dependencies and apply the database schema:**
   ```bash
   npm install
   npx supabase login                               # one-time, opens a browser
   npx supabase link --project-ref your-project-ref  # project ref is in the Supabase dashboard URL
   npm run db:push                                   # applies supabase/migrations/ to that project
   ```
5. **Create the first admin account** (one-time — every account after this
   one is created from Settings in the app itself):
   ```bash
   node --env-file=.env.local scripts/create-admin.mjs you@example.com a-strong-password "Your Name"
   ```
6. **(Optional) Push notifications:** generate a VAPID keypair —
   ```bash
   npx web-push generate-vapid-keys
   ```
   and add it to `.env.local`:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=the-public-key
   VAPID_PRIVATE_KEY=the-private-key
   VAPID_SUBJECT=mailto:you@example.com
   ```
   The public key needs the `NEXT_PUBLIC_` prefix since
   `components/shared/NotificationToggle.tsx` also reads it client-side to
   subscribe; the private key must never get that prefix. Without these
   three set, the "הפעלת התראות" button in Settings shows an error instead
   of subscribing, but everything else in the app works unaffected.
7. **Run it:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and log in with the
   account from step 5.

Until the env vars are set, the app shows a setup notice instead of the grid.

## Dev vs. prod database

There are two Supabase projects: **MiPo** (prod — whatever's actually deployed reads
from this one) and **MiPo-dev** (local development and manual testing). `.env.local`
should always point at MiPo-dev, never at prod — that's what keeps testing (creating
throwaway requests, trying to break login lockout, etc.) from touching real data.

`npm run db:*` scripts default to **MiPo-dev** (`--project-ref` is baked into each
script in `package.json`). Pushing a schema change to prod is a separate, explicit
step so it can't happen by accident:

```bash
npm run db:push        # applies supabase/migrations/ to MiPo-dev
npm run db:push:prod   # applies the same migrations to MiPo (prod) — run this once
                        # you've verified the change against dev
```

`db:pull`/`db:pull:prod` are the read-only equivalents, if you ever need to diff
against one side by hand.

## Database migrations

The schema lives in [`supabase/migrations/`](supabase/migrations/), applied with the
[Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
(installed as a dev dependency, run via `npx supabase` or the `npm run db:*` scripts
above) — not by re-running a hand-edited SQL file.

To change the schema:

```bash
npm run db:migration:new -- a_short_description   # creates supabase/migrations/<timestamp>_a_short_description.sql
# edit that file
npm run db:push                                    # applies it to MiPo-dev first
npm run db:push:prod                               # then to prod, once it's verified
```

Every schema change is a new migration file; existing migration files are never edited
after they've been applied anywhere. `npm run db:diff -- -f some_name` can generate a
migration from changes made by hand in the Supabase dashboard, if that ever happens.

## Project structure

```
app/          routes (Server Components) + Server Actions (actions.ts files)
components/   auth/ calendar/ leave-types/ requests/ users/ shared/
lib/          auth/ leave/ utils/ hooks/ supabase/
supabase/     migrations/ (schema) + config.toml (Supabase CLI)
```

`components/` and `lib/` are grouped by domain — a new leave-type component goes in
`components/leave-types/`, a new auth helper in `lib/auth/`, and so on.
`components/shared/` and `lib/utils/` are for things genuinely used across domains, not
a catch-all for anything uncertain.

## Testing

```bash
npm run test
```

Runs the Vitest suite (`lib/**/*.test.ts`) — currently covers the pure logic in
`lib/leave/leave.ts` and `lib/leave/resolveEmployeeName.ts`. Add a test alongside any
new non-trivial `lib/` logic the same way. UI and anything that needs a live Supabase
connection isn't covered here — verify those by hand in the running app.

## Notes

- **Auth:** login only, no public signup — an admin creates every account
  (email + password + display name + role) from Settings → ניהול משתמשים.
  Every screen is gated behind login (see `middleware.ts`); only `admin`-role
  accounts can reach Settings (leave types and user accounts). RLS requires
  an authenticated session on every table (see `supabase/migrations/`).
- Each leave request is linked to the submitting profile via `profile_id`
  (enforced by RLS — a non-admin can only see/write their own). `employee_name`
  stays as a denormalized display label kept in sync by a trigger when a
  profile is renamed.
- Leave types live in the `leave_types` table — add a row there to add a new type;
  pick a `color_key` that has a matching `--leave-<color_key>` token in
  `app/globals.css` (currently `vacation`, `medical`, `other`, `green`, `teal`, `rose`).
- **Push notifications** (`lib/push/`): opt-in per device, enabled from Settings
  → "הפעלת התראות". Admins get pushed on every new request; the submitting
  employee gets pushed when their request is approved/denied. Sending is
  always best-effort — a missing VAPID config or a failed send never fails
  the action that triggered it. Requires the service worker at `public/sw.js`
  (also used for PWA installability via `public/manifest.json`).
- **Security hardening:**
  - Security headers + a baseline CSP are set in `next.config.ts` (CSP allows
    `'unsafe-inline'` for script/style, since Next's own hydration scripts
    are inline and there's no nonce-based setup — a stricter nonce-based CSP
    is a possible future upgrade).
  - Login lockout (`login_attempts` table, enforced in `app/login/actions.ts`):
    5 consecutive failed logins for an email locks it out for 15 minutes.
    Same generic error message either way, so a lockout can't be used to
    confirm an account exists.
  - Every admin action (user/leave-type create/update/delete) is recorded to
    `admin_audit_log` via `lib/auth/auditLog.ts`. There's no UI to view it
    yet — it's captured so the history exists once one is built.
  - **Known limitations, not yet addressed:** no MFA (a full TOTP
    enrollment/challenge flow is a larger separate feature); an admin-initiated
    password reset doesn't invalidate the target user's other active
    sessions — `@supabase/auth-js`'s admin API has no "revoke all sessions for
    this user id" method (`admin.signOut` takes a specific JWT, not a user
    id), so this isn't cleanly fixable without a fragile workaround.
