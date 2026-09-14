import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isAccessTokenExpired(token: string) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof decoded.exp !== "number" || Date.now() >= decoded.exp * 1000 - 60_000;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const isAbout = request.cookies.get("is_about")?.value === "true";
  const pathname = request.nextUrl.pathname;

  // This route owns the refresh operation and must never be redirected by middleware.
  if (pathname === "/api/auth/refresh") {
    return NextResponse.next();
  }

  const protectedRoutes = [
    "/complete/profile",
    "/home",
    "/saved-collection",
    "/settings",
    "/community",
    "/collaboration",
    "/chat",
    "/create-post",
    "/profile/edit",
    "/settings",
    "/share-something",
    "/explore",
  ];

  const protectAuthRoutes = ["/sign-in", "/join-us", "/forgot-password"];

  if (token && isAccessTokenExpired(token)) {
    if (protectedRoutes.some((route) => pathname.startsWith(route)) && refreshToken) {
      const refreshUrl = new URL("/api/auth/refresh", request.url);
      refreshUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(refreshUrl);
    }

    const response = NextResponse.next();
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    return response;
  }

  if (!token) {
    // user is not loggedin
    console.log("token not found");

    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  } else {
    // ignore isAbout check on complete profile page - bcz it will check on that ppage
    if (!pathname.startsWith("/complete-profile")) {
      // check loggedin user has completed the profile on other routes
      if (!isAbout) {
        return NextResponse.redirect(new URL("/complete-profile", request.url));
      } else if (
        protectAuthRoutes.some((route) => pathname.startsWith(route))
      ) {
        // restrict user to access for authentication pages
        return NextResponse.redirect(new URL("/home", request.url));
      }
    }
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
