"use server";

// The only session functions a browser may trigger. Everything else (token reads, refresh,
// auth headers) stays in session.ts, which is server-only, so tokens can't be pulled out
// through a public Server Action.
//
// Client components that used to import clearSession / storeIsAbout / checkIsAbout / getSession
// from session.ts should import them from here instead. Server code can keep importing session.ts.

import * as session from "@/lib/session";
import { getUserPersonalInfoAction } from "./auth.action";
import { jwtDecode } from "jwt-decode";

export async function clearSession(): Promise<{ success: boolean }> {
  return session.clearSession();
}

export async function storeIsAbout(isAbout: boolean): Promise<void> {
  if (typeof isAbout !== "boolean") return;
  return session.storeIsAbout(isAbout);
}

export async function checkIsAbout(): Promise<boolean> {
  return session.checkIsAbout();
}

// Return profile data to browser callers, never the authentication token.
export async function getCurrentSessionUserAction() {
  if (!(await session.getSession())) return null;
  return getUserPersonalInfoAction("");
}

export async function resolveViewerIdAction() {
  const accessToken = await session.getSession();

  if (await session.isAccessTokenExpired()) {
    const userRes = await getUserPersonalInfoAction("");
    return userRes?.response?._id || "";
  }

  try {
    return String(jwtDecode<{ sub?: string }>(accessToken).sub || "");
  } catch {
    return "";
  }
}
