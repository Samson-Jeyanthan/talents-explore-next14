import type { ICurrentUser } from "@/types/auth.types";

export const AUTH_USER_CACHE_KEY = "talents-explore-auth-user";

function cachedUser(value: unknown): ICurrentUser | null {
  if (!value || typeof value !== "object") return null;
  const user = value as Record<string, unknown>;
  if (
    typeof user.currentUserId !== "string" ||
    !user.currentUserId.trim() ||
    typeof user.username !== "string" ||
    typeof user.email !== "string" ||
    (user.firstName !== undefined && typeof user.firstName !== "string") ||
    (user.lastName !== undefined && typeof user.lastName !== "string") ||
    (user.imageUrl != null && typeof user.imageUrl !== "string") ||
    (user.isTalent !== undefined && typeof user.isTalent !== "boolean")
  )
    return null;
  // Older incomplete profiles can omit display fields. Cache display data only.
  return {
    currentUserId: user.currentUserId,
    username: user.username,
    email: user.email,
    firstName: (user.firstName as string) || "",
    lastName: (user.lastName as string) || "",
    imageUrl: (user.imageUrl as string | null | undefined) ?? null,
    isTalent: (user.isTalent as boolean | undefined) ?? false,
  };
}

export function clearCachedAuthUser() {
  try {
    if (typeof window !== "undefined")
      window.sessionStorage.removeItem(AUTH_USER_CACHE_KEY);
  } catch {
    /* Browser storage is optional. */
  }
}

export function readCachedAuthUser(): ICurrentUser | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(AUTH_USER_CACHE_KEY);
    if (raw === null) return null;
    const user = cachedUser(JSON.parse(raw));
    if (!user) clearCachedAuthUser();
    return user;
  } catch {
    clearCachedAuthUser();
    return null;
  }
}

export function writeCachedAuthUser(user: ICurrentUser): boolean {
  try {
    if (typeof window === "undefined") return false;
    const value = cachedUser(user);
    if (!value) {
      clearCachedAuthUser();
      return false;
    }
    window.sessionStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(value));
    return true;
  } catch {
    // When quota prevents replacement, remove the old entry rather than restore
    // stale profile details on the next load. Blocked storage falls back to API.
    clearCachedAuthUser();
    return false;
  }
}
