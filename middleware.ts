import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyIsAbout, verifySession } from "./lib/session";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const token = await verifySession();
  const isAbout = await verifyIsAbout();

  const protectedRoutes = [
    "/home",
    "/saved-collection",
    "/settings",
    "/community",
    "/create-post",
  ];

  const protectAuthRoutes = ["/sign-in", "/join-us", "/forgot-password"];

  if (!token) {
    console.log("token not found");

    if (
      protectedRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
      )
    ) {
      return NextResponse.rewrite(new URL("/sign-in", request.url));
    }
  } else {
    console.log("logged in");
    if (isAbout === false) {
      return NextResponse.rewrite(new URL("/complete-profile", request.url));
    }

    if (
      protectAuthRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
      )
    ) {
      return NextResponse.rewrite(new URL("/home", request.url));
    }
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
