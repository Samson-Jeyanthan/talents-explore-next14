"use server";

import { refreshAccessTokenAction } from "@/actions/tokenAndHeaders.action";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ─── Constants ────────────────────────────────────────────────────────────────

const COOKIE_NAMES = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
  isAbout: "is_about",
} as const;

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days (ms)

interface AccessTokenPayload {
  sub: string;
  iat: number;
  exp: number;
  jti: string;
}

// ─── Create Session ───────────────────────────────────────────────────────────
export async function createSession(
  accessToken: string,
  refreshToken: string
): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();

    const accessTokenExpiry = new Date(Date.now() + TOKEN_EXPIRY);
    const refreshTokenExpiry = new Date(Date.now() + TOKEN_EXPIRY);

    // Save access token
    cookieStore.set(COOKIE_NAMES.accessToken, accessToken, {
      ...baseCookieOptions,
      expires: accessTokenExpiry,
    });

    // Save refresh token — scoped to refresh endpoint only, longer expiry
    cookieStore.set(COOKIE_NAMES.refreshToken, refreshToken, {
      ...baseCookieOptions,
      path: "/", // adjust to your actual refresh route
      expires: refreshTokenExpiry,
    });

    return { success: true };
  } catch (error) {
    console.error("[createSession] Failed:", error);
    return { success: false };
  }
}

// ─── Get Access Token ─────────────────────────────────────────────────────────
export async function getSession(): Promise<string> {
  try {
    const accessToken = cookies().get(COOKIE_NAMES.accessToken)?.value;
    if (!accessToken) return "";
    return accessToken;
  } catch (error) {
    console.error("[getSession] Failed:", error);
    return "";
  }
}

// ─── Get Refresh Token ────────────────────────────────────────────────────────
export async function getRefreshToken(): Promise<string | null> {
  try {
    const refreshToken = await cookies().get(COOKIE_NAMES.refreshToken)?.value;
    if (!refreshToken) return null;
    return refreshToken;
  } catch (error) {
    console.error("[getRefreshToken] Failed:", error);
    return null;
  }
}

// ─── Check if Access Token is Expired ────────────────────────────────────────
export async function isAccessTokenExpired(): Promise<boolean> {
  try {
    const token = (await cookies()).get(COOKIE_NAMES.accessToken)?.value;
    if (!token) return true;

    const decoded = jwtDecode<AccessTokenPayload>(token);
    if (!decoded?.exp || typeof decoded.exp !== "number") return true;

    const expiryMs = decoded.exp * 1000; // exp is in seconds → convert to ms
    const bufferMs = 60 * 1000; // treat as expired 60s early, to allow time for refresh

    return Date.now() >= expiryMs - bufferMs;
  } catch (error) {
    console.error("[isAccessTokenExpired] Failed:", error);
    return true; // fail safe → treat as expired
  }
}

// ─── Clear Session ────────────────────────────────────────────────────────────
export async function clearSession(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();

    cookieStore.delete(COOKIE_NAMES.accessToken);
    cookieStore.delete({
      name: COOKIE_NAMES.refreshToken,
      // path: "/api/auth/refresh",
    });

    return { success: true };
  } catch (error) {
    console.error("[clearSession] Failed:", error);
    return { success: false };
  }
}

// ─── Get Auth Headers ────────────────────────────────────────────────────────
export async function getAuthHeaders() {
  const expired = await isAccessTokenExpired();
  const existingAccessToken = await getSession();

  if (expired) {
    console.log("[getAuthHeaders] Token expired, refreshing...");

    const newTokens = await refreshAccessTokenAction(existingAccessToken);

    if (newTokens === null) {
      await clearSession(); // clear session if refresh fails
      redirect("/sign-in"); // redirect to login page if refresh fails
    }

    await createSession(newTokens.accessToken, newTokens.refreshToken);

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${newTokens.accessToken}`,
    };
  }

  const accessToken = await getSession();

  if (!accessToken) {
    await clearSession();
    redirect("/sign-in"); // redirect to login page if no access token
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

// store isAbout in cookies
export async function storeIsAbout(isOk: boolean) {
  if (isOk) {
    cookies().set("is_about", "true", {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });
  } else {
    cookies().set("is_about", "false", {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });
  }
}

// check isAbout
export async function checkIsAbout() {
  const isAbout = cookies().get("is_about")?.value;
  if (isAbout === "true") {
    return true;
  } else {
    return false;
  }
}

// clear and modify the cookies for token
// export async function clearAndModifyCookies(data: any) {
//   await clearSession();
//   createSession(data.accessToken, data.refreshToken);
// }
