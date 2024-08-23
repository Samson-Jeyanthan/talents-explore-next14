// import "server-only";
"use server";

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
  // console.log(cookies().get("accessToken"), "verify-session");

  // const isAboutCheck = cookies().get("isAbout");
  // console.log(isAboutCheck, "isAboutCheck-in-session.ts");
  if (!session) {
    return "";
  } else {
    return session;
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
    return 200;
  } else {
    cookies().set("isAbout", "false", {
      expires: new Date(Date.now() + 10 * 60 * 1000),
      httpOnly: true,
    });
    return 400;
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
