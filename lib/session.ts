// import "server-only";
"use server";

import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";

// create session
export async function createSession(accessToken: string) {
  // 2 minutes || 7 * 24 * 60 * 60 * 1000); 7 days
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = accessToken;

  // save the session in a cookie
  cookies().set("accessToken", session, {
    expires,
    httpOnly: true,
    sameSite: "strict",
  });

  const res = cookies().get("accessToken");
  return res;
}

//  get session
export async function getSession() {
  const session = cookies().get("accessToken")?.value;
  if (!session) {
    return "";
  } else {
    const decodedJWTToken = jwtDecode(session);
    return decodedJWTToken.sub;
  }
}

// delete session
export async function deleteSession() {
  cookies().delete("accessToken");
  cookies().delete("isAbout");
}

// store isAbout in cookies
export async function storeIsAbout(isOk: boolean) {
  if (isOk) {
    cookies().set("isAbout", "true", {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "strict",
    });
  } else {
    cookies().set("isAbout", "false", {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "strict",
    });
  }
}

// verify isAbout
export async function verifyIsAbout() {
  const isAbout = cookies().get("isAbout")?.value;
  if (isAbout === "true") {
    return true;
  } else {
    return false;
  }
}
