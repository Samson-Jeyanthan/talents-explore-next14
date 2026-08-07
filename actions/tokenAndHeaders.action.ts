"use server";

import {
  getRefreshToken,
  getSession,
  isAccessTokenExpired,
} from "@/lib/session";
import { getUserPersonalInfoAction } from "./auth.action";
import { jwtDecode } from "jwt-decode";

// ─── Get the refresh token from API  ───────────────────────────────────────
export async function refreshAccessTokenAction(
  existingAccessToken: string | null
) {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      console.warn("[refreshAccessToken] No refresh token found");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/access_token?grant_type=refresh_token&refresh_token=${refreshToken}&device_id=webApp`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${existingAccessToken}`,
        },
        cache: "no-store",
      }
    );

    const data: any = await response.json();
    console.log("// [refreshAccessToken] data: //", data);

    if (!response.ok) {
      console.error("[refreshAccessToken] Refresh failed:", response.status);
      return null;
    }

    console.log("// [refreshAccessToken] Token refreshed successfully //");

    return data;
  } catch (error) {
    console.error("[refreshAccessToken] Error:", error);
    return null;
  }
}

export async function resolveViewerIdAction() {
  try {
    let userRes: any = {};
    const expired = await isAccessTokenExpired();
    const accessToken = await getSession();

    if (expired) {
      userRes = await getUserPersonalInfoAction("");

      return userRes?.response?._id || "";
    }
    const decodeToken = jwtDecode(accessToken);
    return decodeToken.sub;
  } catch (error) {
    console.error("resolveViewerId failed:", error);
    return "";
  }
}
