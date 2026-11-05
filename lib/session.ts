"use server";

import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAMES = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
  isAbout: "is_about",
} as const;

const TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
const EXPIRY_BUFFER_MS = 60 * 1000;

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

type AccessTokenPayload = {
  exp?: number;
  sub?: unknown;
};

const tokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: TOKEN_COOKIE_MAX_AGE,
};

// This is a display preference, so it can be read by browser UI if needed.
const preferenceCookieOptions = {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: TOKEN_COOKIE_MAX_AGE,
};

function getTokenPair(payload: unknown): TokenPair | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as {
    accessToken?: unknown;
    refreshToken?: unknown;
    response?: unknown;
  };
  const nested = data.response;
  const candidate =
    nested && typeof nested === "object"
      ? (nested as { accessToken?: unknown; refreshToken?: unknown })
      : data;

  if (
    typeof candidate.accessToken !== "string" ||
    !candidate.accessToken.trim() ||
    typeof candidate.refreshToken !== "string" ||
    !candidate.refreshToken.trim()
  )
    return null;

  return {
    accessToken: candidate.accessToken,
    refreshToken: candidate.refreshToken,
  };
}

export async function createSession(
  accessToken: string,
  refreshToken: string
): Promise<{ success: boolean }> {
  if (
    typeof accessToken !== "string" ||
    !accessToken.trim() ||
    typeof refreshToken !== "string" ||
    !refreshToken.trim()
  ) {
    return { success: false };
  }

  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAMES.accessToken, accessToken, tokenCookieOptions);
    cookieStore.set(
      COOKIE_NAMES.refreshToken,
      refreshToken,
      tokenCookieOptions
    );
    return { success: true };
  } catch {
    console.error("[session] Unable to store tokens");
    return { success: false };
  }
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.refreshToken)?.value ?? null;
}

async function getStoredAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.accessToken)?.value ?? "";
}

export async function isAccessTokenExpired(): Promise<boolean> {
  const token = await getStoredAccessToken();
  if (!token) return true;

  try {
    const { exp } = jwtDecode<AccessTokenPayload>(token);
    return (
      typeof exp !== "number" ||
      !Number.isFinite(exp) ||
      Date.now() >= exp * 1000 - EXPIRY_BUFFER_MS
    );
  } catch {
    return true;
  }
}

async function requestRefreshToken(
  refreshToken: string
): Promise<TokenPair | null> {
  // Keep the backend's existing GET contract. Switch to POST when the backend supports it;
  // query-string tokens may be recorded by server and proxy logs.
  const endpoint =
    process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!endpoint) {
    console.error("[session] Backend URL is not configured");
    return null;
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    device_id: "webApp",
  });

  try {
    const response = await fetch(
      `${endpoint.replace(/\/$/, "")}/auth/access_token?${params}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );
    if (!response.ok) return null;
    return getTokenPair(await response.json());
  } catch {
    console.error("[session] Token refresh request failed");
    return null;
  }
}

export async function refreshSession(): Promise<TokenPair | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const tokens = await requestRefreshToken(refreshToken);
  if (!tokens) return null;

  const stored = await createSession(tokens.accessToken, tokens.refreshToken);
  return stored.success ? tokens : null;
}

export async function getActiveAccessToken(): Promise<string | null> {
  if (await isAccessTokenExpired()) {
    return (await refreshSession())?.accessToken ?? null;
  }
  return (await getStoredAccessToken()) || null;
}

export async function getSession(): Promise<string> {
  return (await getActiveAccessToken()) ?? "";
}

export async function clearSession(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAMES.accessToken);
    cookieStore.delete(COOKIE_NAMES.refreshToken);
    return { success: true };
  } catch {
    console.error("[session] Unable to clear tokens");
    return { success: false };
  }
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const accessToken = await getActiveAccessToken();
  if (!accessToken) {
    await clearSession();
    redirect("/sign-in");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function storeIsAbout(isAbout: boolean): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    COOKIE_NAMES.isAbout,
    String(isAbout),
    preferenceCookieOptions
  );
}

export async function checkIsAbout(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.isAbout)?.value === "true";
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  try {
    // Decoding does not verify the JWT signature. Only use this as a convenience
    // claim; authorization decisions must use a backend-verified identity.
    const payload = jwtDecode<AccessTokenPayload>(session);
    return typeof payload.sub === "string" && payload.sub.length > 0
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}
