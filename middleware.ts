import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  const checkIsAbout = request.cookies.get("isAbout")?.value;

  if (token) {
    const decodedJWTToken = jwtDecode(token);
    console.log(decodedJWTToken.sub, "decodedJWTToken");
    const isAbout = Boolean(checkIsAbout);
    console.log(isAbout, "before-if-else-part", checkIsAbout);

    if (isAbout) {
      // securing complete-profile page for isAbout-true users
      if (request.nextUrl.pathname.startsWith("/complete-profile")) {
        return NextResponse.redirect(new URL("/home", request.url));
      }
    } else {
      // navigating to complete-profile page for isAbout-false users
      return NextResponse.redirect(
        new URL(`/complete-profile/${decodedJWTToken.sub}`, request.url)
      );
    }
  } else {
    console.log("else-part");
  }
}
