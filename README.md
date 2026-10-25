# MiPo (מי פה)

A personal leave-request tracker — replaces a manually-typed WhatsApp list with a
week-grid table (rows = leave types, columns = days) and a one-tap add-request flow.
See [`.claude/skills/sketch-findings-mipo/`](.claude/skills/sketch-findings-mipo/SKILL.md)
for the validated design decisions this implements.

## Setup

1. **Supabase project:** create one at [supabase.com](https://supabase.com) (free
   tier), then in the SQL Editor run [`supabase/schema.sql`](supabase/schema.sql) to
   create the tables and seed the two leave types.
2. **Environment variables:** create a `.env.local` file in the project root with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```
   Easiest way to get both: click **Connect** near the top of your Supabase
   project dashboard — it hands you these two values directly. (Older
   Supabase projects may instead call this the **anon public** key under
   Settings → API — same thing, just older naming.) Never use the
   `service_role` / **secret** key here — that one must stay server-only.
3. **Run it:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

Until the env vars are set, the app shows a setup notice instead of the grid.

## Notes

- v1 has no login/auth. RLS is enabled with an explicit "anon can do
  everything" policy (see `supabase/schema.sql`) — safe today only because the
  anon key lives in a gitignored `.env.local` and nothing is deployed, so
  nobody else can reach the API. **Before deploying to Vercel (or anywhere
  else public): tighten those policies or move writes behind a server-only
  key.** `NEXT_PUBLIC_*` env vars get bundled into client-side JS, so the anon
  key becomes publicly visible the moment this is deployed.
- Employee names are free text on each request (no separate employee list yet).
- Leave types live in the `leave_types` table — add a row there to add a new type;
  pick a `color_key` that has a matching `--leave-<color_key>` token in
  `app/globals.css` (currently `vacation`, `medical`, `other`).
