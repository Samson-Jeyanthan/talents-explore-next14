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
};

const refreshInFlight = new Map<string, Promise<TokenPair | null>>();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: TOKEN_COOKIE_MAX_AGE,
};

function getTokenPair(payload: unknown): TokenPair | null {
  const data = payload as {
    accessToken?: unknown;
    refreshToken?: unknown;
    response?: { accessToken?: unknown; refreshToken?: unknown };
  };
  const candidate = data?.response ?? data;

  if (
    typeof candidate?.accessToken !== "string" ||
    typeof candidate?.refreshToken !== "string" ||
    !candidate.accessToken ||
    !candidate.refreshToken
  ) {
    return null;
  }

  return {
    accessToken: candidate.accessToken,
    refreshToken: candidate.refreshToken,
  };
}

export async function createSession(
  accessToken: string,
  refreshToken: string,
): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAMES.accessToken, accessToken, cookieOptions);
    cookieStore.set(COOKIE_NAMES.refreshToken, refreshToken, cookieOptions);
    return { success: true };
  } catch (error) {
    console.error("[session] Unable to store tokens", error);
    return { success: false };
  }
}

async function getStoredAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.accessToken)?.value ?? "";
}

export async function getSession(): Promise<string> {
  return (await getActiveAccessToken()) ?? "";
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.refreshToken)?.value ?? null;
}

export async function isAccessTokenExpired(): Promise<boolean> {
  const token = await getStoredAccessToken();
  if (!token) return true;

  try {
    const { exp } = jwtDecode<AccessTokenPayload>(token);
    return !exp || Date.now() >= exp * 1000 - EXPIRY_BUFFER_MS;
  } catch {
    return true;
  }
}

export async function clearSession(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAMES.accessToken);
    cookieStore.delete(COOKIE_NAMES.refreshToken);
    return { success: true };
  } catch (error) {
    console.error("[session] Unable to clear tokens", error);
    return { success: false };
  }
}

async function requestRefreshToken(
  refreshToken: string,
  accessToken: string,
): Promise<TokenPair | null> {
  const endpoint = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!endpoint) {
    console.error("[session] NEXT_PUBLIC_BACKEND_URL is not configured");
    return null;
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    device_id: "webApp",
  });

  try {
    const response = await fetch(`${endpoint}/auth/access_token?${params}`, {
      method: "GET",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      cache: "no-store",
    });

    if (!response.ok) return null;
    return getTokenPair(await response.json());
  } catch (error) {
    console.error("[session] Token refresh request failed", error);
    return null;
  }
}

export async function refreshSession(): Promise<TokenPair | null> {
  const refreshToken = await getRefreshToken();
  const accessToken = await getStoredAccessToken();
  if (!refreshToken) return null;

  const pending = refreshInFlight.get(refreshToken);
  if (pending) return pending;

  const refreshPromise = requestRefreshToken(refreshToken, accessToken).finally(() => {
    refreshInFlight.delete(refreshToken);
  });
  refreshInFlight.set(refreshToken, refreshPromise);

  const tokens = await refreshPromise;
  if (tokens) await createSession(tokens.accessToken, tokens.refreshToken);
  return tokens;
}

export async function getActiveAccessToken(): Promise<string | null> {
  if (await isAccessTokenExpired()) {
    return (await refreshSession())?.accessToken ?? null;
  }

  return (await getStoredAccessToken()) || null;
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

export async function storeIsAbout(isAbout: boolean) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES.isAbout, String(isAbout), cookieOptions);
}

export async function checkIsAbout() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.isAbout)?.value === "true";
}
