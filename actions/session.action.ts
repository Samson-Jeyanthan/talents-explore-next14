"use server";

// The only session functions a browser may trigger. Everything else (token reads, refresh,
// auth headers) stays in session.ts, which is server-only, so tokens can't be pulled out
// through a public Server Action.
//
// Client components that used to import clearSession / storeIsAbout / checkIsAbout / getSession
// from session.ts should import them from here instead. Server code can keep importing session.ts.

import * as session from "@/lib/session";

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

// Used by the client-side AuthProvider. Returns the ACCESS token only (never the refresh token),
// refreshing it first when it is stale. This makes the access token readable by scripts running in
// the browser, so keep it only if the client really needs the token itself.
export async function getSession(): Promise<string> {
  return session.getSession();
}
