"use server";

import { jwtDecode } from "jwt-decode";
import { getAuthHeaders, refreshSession } from "@/lib/session";

export async function refreshAccessTokenAction() {
  return refreshSession();
}

export async function resolveViewerIdAction() {
  // Resolve freshness before decoding; a page render may need a route refresh.
  const headers = await getAuthHeaders();
  const accessToken = headers.Authorization.slice("Bearer ".length);

  try {
    return String(jwtDecode<{ sub?: string }>(accessToken).sub || "");
  } catch {
    return "";
  }
}
