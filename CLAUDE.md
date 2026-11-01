# MiPo

- **Sketch findings for MiPo** (design decisions, CSS patterns, visual direction) → `Skill("sketch-findings-mipo")`
- Database schema changes go through `supabase/migrations/` via the Supabase CLI
  (`npm run db:migration:new -- <name>`, then `npm run db:push`). Never hand-edit an
  already-applied migration file — add a new one. There is no `supabase/schema.sql`
  anymore.
- `components/` and `lib/` are organized into domain subfolders — `components/`:
  `auth`, `calendar`, `leave-types`, `requests`, `users`, `shared`; `lib/`: `auth`,
  `leave`, `utils`, `hooks`, `supabase`. Put new files in the matching folder rather
  than at the top level.
