"use server";

import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { clearSession, getAuthHeaders } from "@/lib/session";
import { isRedirectError } from "next/dist/client/components/redirect";

export type DeletionAccount = { id: string; email: string; username: string };
type Failure = {
  status: "7401" | "7403" | "7500";
  message: string;
  reauthenticate?: boolean;
};
export type AccountDeletionResult =
  | { status: "7400"; message: string }
  | Failure;
export type VerifyDeletionResult =
  | { status: "7400"; account: DeletionAccount }
  | Failure;
const TOKEN_COOKIE = "te_account_delete";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 600,
};
const credentials = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(256),
});
const validId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

async function clearVerification() {
  (await cookies()).set(TOKEN_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

async function readAccount(
  headers: Record<string, string>,
): Promise<DeletionAccount | null> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/`, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  const account = result?.response;
  if (
    !response.ok ||
    result?.status !== "7400" ||
    !validId(account?._id) ||
    typeof account?.email !== "string" ||
    !account.email
  )
    return null;
  return {
    id: account._id,
    email: account.email,
    username: typeof account.userName === "string" ? account.userName : "",
  };
}

export async function verifyDeletionAccountAction(
  input: unknown,
): Promise<VerifyDeletionResult> {
  try {
    await clearVerification();
    const parsed = credentials.safeParse(input);
    if (!parsed.success)
      return {
        status: "7401",
        message: "Enter a valid email address and your password.",
      };
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          ...parsed.data,
          deviceId: randomUUID(),
          appVersion: "0.1.0",
        }),
      },
    );
    const result = await response.json();
    const token = result?.response?.accessToken || result?.response?.token;
    if (
      !response.ok ||
      result?.status !== "7400" ||
      typeof token !== "string" ||
      !token
    )
      return {
        status: "7403",
        message:
          "Unable to verify this account. Check your email and password and try again.",
      };
    const account = await readAccount({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    });
    if (
      !account ||
      account.email.toLowerCase() !== parsed.data.email.toLowerCase()
    )
      return {
        status: "7403",
        message: "Unable to verify the account details. Please sign in again.",
      };
    (await cookies()).set(TOKEN_COOKIE, token, cookieOptions);
    return { status: "7400", account };
  } catch {
    return {
      status: "7500",
      message: "Unable to verify your account right now. Please try again.",
    };
  }
}

async function removeAccount(
  headers: Record<string, string>,
  expectedAccountId: string,
): Promise<AccountDeletionResult> {
  const account = await readAccount(headers);
  if (!account || account.id !== expectedAccountId)
    return {
      status: "7403",
      message:
        "Your account verification has changed or expired. Please sign in again before deleting.",
      reauthenticate: true,
    };
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/deleteAccount`,
    {
      method: "DELETE",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    },
  );
  const result = await response.json();
  if (!response.ok || result?.status !== "7400")
    return {
      status: response.status === 401 ? "7403" : "7500",
      message: "Unable to delete your account. Please try again.",
      reauthenticate: response.status === 401,
    };
  // Once acknowledged, cleanup errors must not report that deletion failed.
  try {
    await clearVerification();
  } catch {}
  try {
    await clearSession();
  } catch {}
  return {
    status: "7400",
    message: "Your account has been deleted permanently.",
  };
}

export async function deleteVerifiedAccountAction(
  expectedAccountId: unknown,
  confirmed: unknown,
): Promise<AccountDeletionResult> {
  if (confirmed !== true || !validId(expectedAccountId))
    return {
      status: "7401",
      message: "Please confirm which account you want to delete.",
    };
  try {
    const token = (await cookies()).get(TOKEN_COOKIE)?.value;
    if (!token)
      return {
        status: "7403",
        message: "Your verification has expired. Please sign in again.",
        reauthenticate: true,
      };
    return await removeAccount(
      { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      expectedAccountId,
    );
  } catch {
    return {
      status: "7500",
      message: "Unable to confirm account deletion. Please try again.",
    };
  }
}

export async function cancelAccountDeletionAction() {
  try {
    await clearVerification();
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function deleteCurrentAccountAction(
  expectedAccountId: unknown,
  confirmed: unknown,
): Promise<AccountDeletionResult> {
  if (confirmed !== true || !validId(expectedAccountId))
    return {
      status: "7401",
      message: "Please confirm which account you want to delete.",
    };
  try {
    return await removeAccount(await getAuthHeaders(), expectedAccountId);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: "7500",
      message: "Unable to confirm account deletion. Please try again.",
    };
  }
}
