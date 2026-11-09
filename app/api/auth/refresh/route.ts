// import { NextRequest, NextResponse } from "next/server";
// import { clearSession, refreshSession } from "@/lib/session";

// function getSafeDestination(value: string | null): string {
//   if (
//     value?.startsWith("/") &&
//     !value.startsWith("//") &&
//     !value.startsWith("/\\")
//   ) {
//     console.log("Safe destination:", value);
//     return value;
//   }

//   return "/home";
// }

// export async function GET(request: NextRequest) {
//   const destination = getSafeDestination(
//     request.nextUrl.searchParams.get("next")
//   );

//   try {
//     const tokens = await refreshSession();

//     if (!tokens) {
//       console.warn(
//         "[auth/refresh] Session refresh failed, redirecting to sign-in --route.ts--"
//       );
//       await clearSession();
//       return NextResponse.redirect(new URL("/sign-in", request.url));
//     }

//     return NextResponse.redirect(new URL(destination, request.url));
//   } catch (error) {
//     console.error("[auth/refresh] Session refresh failed");
//     await clearSession();
//     return NextResponse.redirect(new URL("/sign-in", request.url));
//   }
// }
// app/api/auth/refresh/route.ts
//
// Server Components can't write cookies, so getAuthHeaders() redirects here when the access token
// is stale. This route refreshes the session (cookies CAN be written in a Route Handler) and sends
// the user back to the page they came from.
import { NextRequest, NextResponse } from "next/server";
import { clearSession, refreshSession } from "@/lib/session";

// Never cache this: it must run on every request.
export const dynamic = "force-dynamic";

const FALLBACK = "/home";

// Only allow same-site relative paths. Parsing against a dummy origin normalises tricks like
// "/\evil.com", "/%2F/evil.com" or tab characters; anything that leaves the dummy origin is
// rejected. "/api/" is blocked to prevent a refresh -> refresh loop.
function getSafeDestination(value: string | null): string {
  if (!value || !value.startsWith("/")) return FALLBACK;
  try {
    const base = "http://localhost";
    const url = new URL(value, base);
    if (url.origin !== base) return FALLBACK;
    if (url.pathname.startsWith("/api/")) return FALLBACK;
    return url.pathname + url.search;
  } catch {
    return FALLBACK;
  }
}

export async function GET(request: NextRequest) {
  const destination = getSafeDestination(
    request.nextUrl.searchParams.get("next")
  );

  // Writes the new cookies on success (allowed in a Route Handler).
  const result = await refreshSession();

  console.log("[auth/refresh] result", result);

  // Never log `result`: on success it contains the new access and refresh tokens.
  console.log(
    "[auth/refresh]",
    result.ok ? "refreshed" : `failed (invalid=${result.invalid})`
  );

  if (result.ok) {
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Only wipe the session if the backend actually rejected the refresh token.
  // On a network error or timeout the cookies are kept so a retry can still work.
  if (result.invalid) {
    await clearSession();
  }

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("next", destination);
  return NextResponse.redirect(signInUrl);
}
