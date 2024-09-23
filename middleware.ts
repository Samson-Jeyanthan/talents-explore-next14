import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyIsAbout, verifySession } from "./lib/session";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const token = await verifySession();
  const isAbout = await verifyIsAbout();

  if (token === "") {
    console.log("token not found");
    if (request.nextUrl.pathname.startsWith("/home")) {
      return NextResponse.rewrite(new URL("/sign-in", request.url));
    }
  } else {
    console.log("runnning middleware");
    if (isAbout === false) {
      return NextResponse.rewrite(new URL("/complete-profile", request.url));
    }
    if (request.nextUrl.pathname.startsWith("/sign-in")) {
      return NextResponse.rewrite(new URL("/home", request.url));
    }

    if (request.nextUrl.pathname.startsWith("/join-us")) {
      return NextResponse.rewrite(new URL("/home", request.url));
    }

    if (request.nextUrl.pathname.startsWith("/forgot-password")) {
      return NextResponse.rewrite(new URL("/home", request.url));
    }
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/home", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
