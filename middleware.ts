import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/complete-profile",
  "/home",
  "/saved-collection",
  "/settings",
  "/community",
  "/collaboration",
  "/chat",
  "/create-post",
  "/share",
  "/profile/edit",
  "/explore",
  "/share-feed",
  "/onboarding",
  "/talent-registration",
];

const authRoutes = ["/sign-in", "/join-us", "/forgot-password"];

function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function matchesAnyRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => matchesRoute(pathname, route));
}

// This decodes the expiry as a routing hint. It does not verify the JWT signature.
function isAccessTokenExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded: unknown = JSON.parse(atob(padded));

    if (!decoded || typeof decoded !== "object" || !("exp" in decoded)) {
      return true;
    }

    const exp = (decoded as { exp?: unknown }).exp;

    return (
      typeof exp !== "number" ||
      !Number.isFinite(exp) ||
      Date.now() >= exp * 1000 - 60_000
    );
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Let the refresh handler complete its work without middleware intercepting it.
  if (pathname === "/api/auth/refresh") {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const isAbout = request.cookies.get("is_about")?.value === "true";

  const isProtectedRoute = matchesAnyRoute(pathname, protectedRoutes);
  const isAuthRoute = matchesAnyRoute(pathname, authRoutes);
  const isApiRequest = pathname.startsWith("/api/");

  // Handle both missing and expired access tokens.
  if (isProtectedRoute && (!token || isAccessTokenExpired(token))) {
    if (refreshToken) {
      const refreshUrl = new URL("/api/auth/refresh", request.url);
      refreshUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(refreshUrl);
    }

    if (isApiRequest) {
      const response = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", `${pathname}${search}`);

    const response = NextResponse.redirect(signInUrl);
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    return response;
  }

  if (
    token &&
    isProtectedRoute &&
    pathname !== "/complete-profile" &&
    !isAbout
  ) {
    return NextResponse.redirect(new URL("/complete-profile", request.url));
  }

  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
