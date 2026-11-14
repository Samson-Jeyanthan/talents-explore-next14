// Server-only session helpers. This file is intentionally NOT "use server": every export of a
// "use server" file becomes a public endpoint any browser script can call, which would let it read
// the httpOnly tokens through getRefreshToken()/getSession(). Client-callable actions live in
// session-actions.ts instead.
// import "server-only";
"use server";

import { jwtDecode } from "jwt-decode";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAMES = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
  isAbout: "is_about",
} as const;

const REFRESH_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const EXPIRY_BUFFER_MS = 60 * 1000; // treat the token as expired 1 minute early
const REFRESH_REUSE_MS = 15 * 1000; // share one refresh result for 15 seconds
const REFRESH_TIMEOUT_MS = 10 * 1000;

// The backend does not validate device_id on refresh (tested with a different value: still 200).
// If you track devices, send the same value here that signInAction sends as `deviceId`.
const DEVICE_ID = "web";

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

type AccessTokenPayload = {
  exp?: number;
  sub?: unknown;
};

// invalid = the backend rejected the refresh token (vs. a network error / 5xx)
type RefreshResult =
  | ({ ok: true } & TokenPair)
  | { ok: false; invalid: boolean };

type ResolvedToken =
  | { kind: "token"; accessToken: string }
  | { kind: "needs-route-refresh" } // read-only context (Server Component)
  | { kind: "signed-out" };

const baseCookieOptions = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// Both auth cookies live as long as the refresh token. GET /auth/access_token REQUIRES a Bearer
// header and accepts an EXPIRED access token there (tested), so the old access token must stay
// available after it expires. Whether it is stale is decided from the JWT's own exp
// (isTokenExpired), never from the cookie's lifetime.
const authCookieOptions = {
  ...baseCookieOptions,
  httpOnly: true,
  maxAge: REFRESH_MAX_AGE,
};

// Display preference, so browser UI may read it.
const preferenceCookieOptions = {
  ...baseCookieOptions,
  httpOnly: false,
  maxAge: REFRESH_MAX_AGE,
};

/* ------------------------------ helpers ------------------------------ */

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

function isTokenExpired(token: string | undefined): boolean {
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

async function getStoredAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.accessToken)?.value ?? "";
}

async function writeTokenCookies(tokens: TokenPair): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    COOKIE_NAMES.accessToken,
    tokens.accessToken,
    authCookieOptions
  );
  cookieStore.set(
    COOKIE_NAMES.refreshToken,
    tokens.refreshToken,
    authCookieOptions
  );
}

// Cookies can only be written in Server Actions and Route Handlers. This probes
// that by re-writing the current refresh token with its own value, which is harmless.
// It must run BEFORE calling the backend, because the backend rotates the refresh token.
async function canWriteCookies(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const current = cookieStore.get(COOKIE_NAMES.refreshToken)?.value;
    if (!current) return false;
    cookieStore.set(COOKIE_NAMES.refreshToken, current, authCookieOptions);
    return true;
  } catch {
    return false;
  }
}

/* --------------------------- backend refresh --------------------------- */

// GET {BACKEND_URL}/auth/access_token?grant_type=refresh_token&refresh_token=...&device_id=...
// with  Authorization: Bearer <access token>.  BACKEND_URL must already end with /api.
async function doRefresh(
  refreshToken: string,
  accessToken: string
): Promise<RefreshResult> {
  const endpoint =
    process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!endpoint) {
    console.error("[session] Backend URL is not configured");
    return { ok: false, invalid: false };
  }

  // Without the Bearer header the backend answers 500 "invalid_grant" even for a good refresh
  // token (tested), so there is nothing to try once the access cookie is gone.
  if (!accessToken) return { ok: false, invalid: true };

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    device_id: DEVICE_ID,
  });

  try {
    const response = await fetch(`${endpoint}/auth/access_token?${params}`, {
      method: "GET",
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
    });

    console.log("--------------------------------------------------");
    console.log("[session] refresh response", response);
    console.log("--------------------------------------------------");

    // Read the body exactly once. Never log `response`: its url contains the refresh token.
    const body = (await response.json().catch(() => null)) as {
      message?: unknown;
    } | null;

    console.log("[session] refresh tokens --189--session.ts--", body);

    if (!response.ok) {
      console.warn(
        "[session] refresh rejected",
        response.status,
        body?.message
      );
      // The backend answers 500 {"message":"invalid_grant"} for a bad/used refresh token.
      const invalid =
        [400, 401, 403].includes(response.status) ||
        body?.message === "invalid_grant";
      return { ok: false, invalid };
    }

    const tokens = getTokenPair(body);
    console.log("[session] refresh tokens --203--session.ts--", tokens);
    return tokens ? { ok: true, ...tokens } : { ok: false, invalid: true };
  } catch (error) {
    // Network error or timeout: do not log the user out.
    console.error(
      "[session] refresh request failed:",
      error instanceof Error ? error.name : "unknown"
    );
    return { ok: false, invalid: false };
  }
}

// Refresh tokens are single-use: a second call with an already-used token fails with
// invalid_grant (tested). Parallel callers holding the same token therefore share ONE backend
// call, and a successful result is reused for REFRESH_REUSE_MS. This map is per server process;
// refresh from one place (a Server Action or /api/auth/refresh), not from several runtimes.
const recentRefreshes = new Map<
  string,
  { promise: Promise<RefreshResult>; at: number }
>();

function refreshOnce(
  refreshToken: string,
  accessToken: string
): Promise<RefreshResult> {
  const now = Date.now();
  for (const [key, entry] of Array.from(recentRefreshes.entries())) {
    if (now - entry.at >= REFRESH_REUSE_MS) recentRefreshes.delete(key);
  }

  const existing = recentRefreshes.get(refreshToken);
  if (existing) return existing.promise;

  const promise = doRefresh(refreshToken, accessToken);
  recentRefreshes.set(refreshToken, { promise, at: now });
  promise.then((result) => {
    if (!result.ok) recentRefreshes.delete(refreshToken);
  });
  return promise;
}

// Kept for existing imports. Pass accessToken when the caller cannot read cookies itself.
export async function requestRefreshToken(
  refreshToken: string,
  accessToken?: string
): Promise<RefreshResult> {
  return refreshOnce(
    refreshToken,
    accessToken ?? (await getStoredAccessToken())
  );
}

// Returns a usable access token, refreshing when it is safe to write cookies.
async function resolveAccessToken(): Promise<ResolvedToken> {
  const stored = await getStoredAccessToken();
  if (!isTokenExpired(stored)) return { kind: "token", accessToken: stored };

  if (!(await getRefreshToken())) return { kind: "signed-out" };
  if (!(await canWriteCookies())) return { kind: "needs-route-refresh" };

  const result = await refreshSession();
  if (result.ok) return { kind: "token", accessToken: result.accessToken };

  if (result.invalid) await clearSession();
  return { kind: "signed-out" };
}

/* ------------------------------- exports ------------------------------- */

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
    await writeTokenCookies({ accessToken, refreshToken });
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

export async function isAccessTokenExpired(): Promise<boolean> {
  return isTokenExpired(await getStoredAccessToken());
}

// Only call this from a Server Action or Route Handler (it writes cookies).
export async function refreshSession(): Promise<RefreshResult> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return { ok: false, invalid: true };

  const result = await refreshOnce(refreshToken, await getStoredAccessToken());
  if (!result.ok) return result;

  try {
    await writeTokenCookies(result);
  } catch {
    console.error("[session] Unable to store refreshed tokens");
    return { ok: false, invalid: false };
  }
  return result;
}

export async function getSession(): Promise<string> {
  const resolved = await resolveAccessToken();
  if (resolved.kind === "token") return resolved.accessToken;
  if (resolved.kind === "needs-route-refresh") return getStoredAccessToken();
  return "";
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
  const resolved = await resolveAccessToken();

  if (resolved.kind === "needs-route-refresh") {
    // Server Component: cookies can't be written here, so let the route handler do it.
    const path = (await headers()).get("x-pathname") ?? "/home";
    redirect(`/api/auth/refresh?next=${encodeURIComponent(path)}`);
  }

  if (resolved.kind === "signed-out") {
    redirect("/sign-in");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${resolved.accessToken}`,
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
