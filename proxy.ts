import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Not configured yet — let each page's own ErrorScreen handle it instead
  // of redirecting into a login page that can't work either.
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Required even though the user is unused below — this both refreshes the
  // session cookie (see setAll above) and validates it against Supabase, unlike
  // reading the cookie-decoded session alone, which can't tell a stale/revoked
  // session from a valid one.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((p) =>
    request.nextUrl.pathname.startsWith(p),
  );

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && request.nextUrl.pathname === "/login") {
    // A valid session alone isn't enough — an auth user with no profiles row
    // (e.g. a user-creation rollback that itself failed) would otherwise get
    // bounced right back here by every other page's own redirect("/login"),
    // an infinite loop. Only send them on to "/" once a profile confirms
    // they're actually a usable account.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (profile) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  // Excludes any path whose last segment has a file extension (manifest.json,
  // sw.js, icon.svg, favicon.ico, and anything else dropped into public/
  // later) rather than naming each one — a logged-in-only app has no real
  // route that looks like a filename, so this is a safe general rule, not
  // just these specific files today.
  matcher: ["/((?!_next/static|_next/image|.*\\.).*)"],
};
