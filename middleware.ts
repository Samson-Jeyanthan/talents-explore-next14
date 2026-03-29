import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  const isAbout = request.cookies.get("isAbout")?.value === "true";
  const pathname = request.nextUrl.pathname;

  const protectedRoutes = [
    "/complete/profile",
    "/home",
    "/saved-collection",
    "/settings",
    "/community",
    "/create-post",
    "/profile/edit",
    "/settings",
    "/share-something",
    "/explore",
  ];

  const protectAuthRoutes = ["/sign-in", "/join-us", "/forgot-password"];

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
