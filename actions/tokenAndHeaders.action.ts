"use server";

import { jwtDecode } from "jwt-decode";
import {
  // getSession,
  isAccessTokenExpired,
  refreshSession,
} from "@/lib/session";
import { getSession } from "./session.action";
import { getUserPersonalInfoAction } from "./auth.action";

export async function refreshAccessTokenAction() {
  return refreshSession();
}

export async function resolveViewerIdAction() {
  const accessToken = await getSession();

  if (await isAccessTokenExpired()) {
    const userRes = await getUserPersonalInfoAction("");
    return userRes?.response?._id || "";
  }

  try {
    return String(jwtDecode<{ sub?: string }>(accessToken).sub || "");
  } catch {
    return "";
  }
}
