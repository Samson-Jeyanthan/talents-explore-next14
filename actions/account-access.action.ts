"use server";

import { getAuthHeaders } from "@/lib/session";

// Account type comes from the authenticated API, never a browser hint or URL.
export async function getCurrentAccountAccessAction() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/`, {
    headers: await getAuthHeaders(),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  const user = result?.response;
  if (
    !response.ok ||
    result?.status !== "7400" ||
    typeof user?._id !== "string" ||
    !/^[a-f\d]{24}$/i.test(user._id) ||
    typeof user.isTalent !== "boolean"
  )
    throw new Error("Unable to verify your account. Please try again.");
  return { _id: user._id as string, isTalent: user.isTalent as boolean };
}
