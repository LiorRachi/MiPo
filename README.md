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
3. **Environment variables:** create a `.env.local` file in the project root with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
   Get the first two from **Connect** near the top of your Supabase project
   dashboard (older projects may call the second one the **anon public** key
   under Settings → API — same thing). Get the service-role key from
   Settings → API → **service_role** / secret key. That last one must stay
   server-only — note it has no `NEXT_PUBLIC_` prefix, unlike the other two,
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
6. **Run it:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and log in with the
   account from step 5.

Until the env vars are set, the app shows a setup notice instead of the grid.

## Database migrations

The schema lives in [`supabase/migrations/`](supabase/migrations/), applied with the
[Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
(installed as a dev dependency, run via `npx supabase` or the `npm run db:*` scripts
below) — not by re-running a hand-edited SQL file.

To change the schema:

```bash
npm run db:migration:new -- a_short_description   # creates supabase/migrations/<timestamp>_a_short_description.sql
# edit that file
npm run db:push                                    # applies it to the linked project
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
