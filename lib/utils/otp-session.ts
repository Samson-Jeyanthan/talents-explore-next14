export type OtpKind = "signup" | "password";
export type OtpSession = {
  identifier: string;
  expiresAt: number;
  resendAt: number;
};
export const OTP_WINDOW_MS = 180000;
export const OTP_RESEND_MS = 30000;
const key = (kind: OtpKind) => `te-otp-${kind}`;
export function validOtpIdentifier(
  kind: OtpKind,
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    (kind === "signup"
      ? /^[a-f\d]{24}$/i.test(value)
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
  );
}
function legacyClear() {
  for (const name of [
    "isOTP",
    "countdown",
    "verifiedEmail",
    "registerUserId",
  ]) {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(name);
    } catch {
      /* Optional storage. */
    }
  }
}
export function clearOtpSession(kind: OtpKind) {
  try {
    if (typeof window !== "undefined")
      window.sessionStorage.removeItem(key(kind));
  } catch {
    /* Optional storage. */
  }
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(
      kind === "signup" ? "registerUserId" : "verifiedEmail",
    );
    if (
      !window.localStorage.getItem(
        kind === "signup" ? "verifiedEmail" : "registerUserId",
      )
    ) {
      window.localStorage.removeItem("countdown");
      window.localStorage.removeItem("isOTP");
    }
  } catch {
    /* Optional legacy storage. */
  }
}
export function startOtpSession(
  kind: OtpKind,
  identifier: string,
  now = Date.now(),
): OtpSession {
  const session = {
    identifier,
    expiresAt: now + OTP_WINDOW_MS,
    resendAt: now + OTP_RESEND_MS,
  };
  if (!validOtpIdentifier(kind, identifier))
    throw new Error("Please request a new verification code.");
  try {
    if (typeof window !== "undefined")
      window.sessionStorage.setItem(key(kind), JSON.stringify(session));
  } catch {
    clearOtpSession(kind);
  }
  legacyClear();
  return session;
}
export function readOtpSession(
  kind: OtpKind,
  now = Date.now(),
): OtpSession | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(key(kind));
    if (raw !== null) {
      const value = JSON.parse(raw);
      if (
        validOtpIdentifier(kind, value?.identifier) &&
        Number.isFinite(value.expiresAt) &&
        Number.isFinite(value.resendAt) &&
        value.expiresAt >= value.resendAt
      )
        return value;
      clearOtpSession(kind);
      return null;
    }
    // Older tabs stored no issuance timestamp. Recover the target, but require
    // a resend rather than restart an old countdown after a refresh.
    const signup = window.localStorage.getItem("registerUserId");
    const password = window.localStorage.getItem("verifiedEmail");
    if (window.localStorage.getItem("isOTP") !== "true" || (signup && password))
      return null;
    const identifier = kind === "signup" ? signup : password;
    if (!validOtpIdentifier(kind, identifier)) return null;
    const recovered = { identifier, expiresAt: now, resendAt: now };
    window.sessionStorage.setItem(key(kind), JSON.stringify(recovered));
    legacyClear();
    return recovered;
  } catch {
    clearOtpSession(kind);
    return null;
  }
}
