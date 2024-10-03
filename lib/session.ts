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
  });
  // console.log(cookies().get("accessToken"));
  const res = cookies().get("accessToken");
  return res;
}

// verfiy session
export async function verifySession() {
  const session = cookies().get("accessToken")?.value;

  if (!session) {
    return "";
  } else {
    return session;
  }
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
  return true;
}

// store isAbout in cookies
export async function storeIsAbout(isOk: boolean) {
  if (isOk) {
    cookies().set("isAbout", "true", {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
    });
  } else {
    cookies().set("isAbout", "false", {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
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
