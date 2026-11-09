import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/complete-profile",
  "/onboarding",
  "/talent-registration",
  "/home",
  "/share-feed",
  "/explore",
  "/create-post",
  "/share",
  "/chat",
  "/collaboration",
  "/saved-collection",
  "/category",
  "/settings",
  "/post",
  "/profile",
];

const authRoutes = ["/sign-in", "/join-us", "/forgot-password"];

function matchesAnyRoute(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

// Routing hint only: no signature check, no network call.
// Used so an expired token can't cause a sign-in <-> home redirect loop.
function isExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(
      atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "="))
    );
    return typeof exp !== "number" || Date.now() >= exp * 1000 - 60_000;
  } catch {
    return true;
  }
}

function currentPath(request: NextRequest): string {
  const url = request.nextUrl.clone();
  url.searchParams.delete("_rsc");
  return `${url.pathname}${url.search}`;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const isAbout = request.cookies.get("is_about")?.value === "true";

  const isProtected = matchesAnyRoute(pathname, protectedRoutes);
  const isAuthRoute = matchesAnyRoute(pathname, authRoutes);

  // An expired access token is fine as long as a refresh token exists.
  // The refresh itself happens at API-call time, not here.
  const hasSession = Boolean(accessToken || refreshToken);

  if (isProtected && !hasSession) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", currentPath(request));
    return NextResponse.redirect(signInUrl);
  }

  if (isProtected && pathname !== "/complete-profile" && !isAbout) {
    return NextResponse.redirect(new URL("/complete-profile", request.url));
  }

  // Only a still-valid access token counts here, so a failed refresh can't loop.
  if (isAuthRoute && accessToken && !isExpired(accessToken)) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Lets Server Components know the current path (used by the refresh hand-off).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", currentPath(request));
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
