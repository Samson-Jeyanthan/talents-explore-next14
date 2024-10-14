import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyIsAbout, getSession } from "./lib/session";

export async function middleware(request: NextRequest) {
  const token = await getSession();
  const isAbout = await verifyIsAbout();

  const protectedRoutes = [
    "/complete/profile",
    "/home",
    "/saved-collection",
    "/settings",
    "/community",
    "/create-post",
    "/profile/edit",
    "/settings",
    "/create-share",
    "/explore",
  ];

  const protectAuthRoutes = ["/sign-in", "/join-us", "/forgot-password"];

  if (!token) {
    // user is not loggedin
    console.log("token not found");

    if (
      protectedRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
      )
    ) {
      return NextResponse.rewrite(new URL("/sign-in", request.url));
    }
  } else {
    // user is loggedin
    console.log("logged in");

    // ignore isAbout check on middleware - bcz it will check on the page
    if (!request.nextUrl.pathname.startsWith("/complete-profile")) {
      // check loggedin user has completed the profile on other routes
      if (!isAbout)
        return NextResponse.rewrite(new URL("/complete-profile", request.url));
    }

    // restrict user to access for auth routes
    if (
      protectAuthRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
      )
    ) {
      return NextResponse.rewrite(new URL("/home", request.url));
    }
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
