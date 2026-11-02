-- Brute-force lockout for app/login/actions.ts: tracks consecutive failed
-- logins per email so that endpoint can lock an address out for a while
-- after too many wrong passwords. Keyed pre-session (before any auth.uid()
-- exists), so it must be read/written through the service-role admin client,
-- never the regular RLS-governed one.
create table login_attempts (
  email text primary key,
  failed_count int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table login_attempts enable row level security;

-- No policies: every real caller is the login Server Action itself, which
-- uses the service-role client (bypasses RLS). With no policy here, RLS
-- denies every row to the regular client by default, so a logged-in user's
-- own session can never read or tamper with lockout state — including their
-- own, or (more importantly) anyone else's.
