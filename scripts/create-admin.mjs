// One-time bootstrap: creates the first admin account. After that, create
// every other account (admin or employee) from Settings in the app itself —
// this script exists only to get past the chicken-and-egg problem of needing
// to be logged in as an admin before you can use that screen.
//
// Usage:
//   node --env-file=.env.local scripts/create-admin.mjs <email> <password> <display name>

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [email, password, displayName] = process.argv.slice(2);

if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run this with --env-file=.env.local (see the usage comment at the top of this file).",
  );
  process.exit(1);
}

if (!email || !password || !displayName) {
  console.error(
    "Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password> <display name>",
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  console.error("Failed to create user:", error.message);
  process.exit(1);
}

const { error: profileError } = await supabase.from("profiles").insert({
  id: data.user.id,
  email: email.toLowerCase(),
  display_name: displayName,
  role: "admin",
});

if (profileError) {
  console.error("User created, but failed to create its profile row:", profileError.message);
  console.error(`You can insert it manually: id = ${data.user.id}`);
  process.exit(1);
}

console.log(`Admin account created: ${email}`);
