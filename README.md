# MiPo (מי פה)

A personal leave-request tracker — replaces a manually-typed WhatsApp list with a
week-grid table (rows = leave types, columns = days) and a one-tap add-request flow.
See [`.claude/skills/sketch-findings-mipo/`](.claude/skills/sketch-findings-mipo/SKILL.md)
for the validated design decisions this implements.

## Setup

1. **Supabase project:** create one at [supabase.com](https://supabase.com) (free
   tier), then in the SQL Editor run [`supabase/schema.sql`](supabase/schema.sql) to
   create the tables and seed the two leave types.
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
4. **Create the first admin account** (one-time — every account after this
   one is created from Settings in the app itself):
   ```bash
   node --env-file=.env.local scripts/create-admin.mjs you@example.com a-strong-password "Your Name"
   ```
5. **Run it:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and log in with the
   account from step 4.

Until the env vars are set, the app shows a setup notice instead of the grid.

## Notes

- **Auth:** login only, no public signup — an admin creates every account
  (email + password + display name + role) from Settings → ניהול משתמשים.
  Every screen is gated behind login (see `middleware.ts`); only `admin`-role
  accounts can reach Settings (leave types and user accounts). RLS requires
  an authenticated session on every table (see `supabase/schema.sql`); the
  old "anon full access" v1 policies are gone.
- Employee names are still free text on each leave request — login accounts
  aren't linked to specific employee-name values (anyone logged in can submit
  a request for any name, same as before auth existed).
- Leave types live in the `leave_types` table — add a row there to add a new type;
  pick a `color_key` that has a matching `--leave-<color_key>` token in
  `app/globals.css` (currently `vacation`, `medical`, `other`).
