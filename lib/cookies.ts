// lib/cookies.ts
// Cookie helpers — all cookie names live here so nothing is hardcoded elsewhere.

export const TOKEN_COOKIE  = "cr_token";
export const ROLE_COOKIE   = "cr_role";
export const NAME_COOKIE   = "cr_name";
export const EMAIL_COOKIE  = "cr_email";

/** 30 days in seconds — matches backend JWT expiry (2 592 000 000 ms) */
const THIRTY_DAYS_SEC = 60 * 60 * 24 * 30;

function buildCookieString(name: string, value: string, maxAge: number): string {
  return `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Strict`;
}

// ─── Client-side helpers (browser only) ──────────────────────────────────────

export function setCookie(name: string, value: string): void {
  document.cookie = buildCookieString(name, value, THIRTY_DAYS_SEC);
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export function deleteCookie(name: string): void {
  document.cookie = `${name}=; Max-Age=0; Path=/`;
}

// ─── Persist all auth fields after login ─────────────────────────────────────

export interface AuthCookiePayload {
  token: string;
  role: string;
  fullName: string;
  email: string;
}

export function saveAuthCookies(payload: AuthCookiePayload): void {
  setCookie(TOKEN_COOKIE, payload.token);
  setCookie(ROLE_COOKIE,  payload.role);
  setCookie(NAME_COOKIE,  payload.fullName);
  setCookie(EMAIL_COOKIE, payload.email);
}

export function clearAuthCookies(): void {
  deleteCookie(TOKEN_COOKIE);
  deleteCookie(ROLE_COOKIE);
  deleteCookie(NAME_COOKIE);
  deleteCookie(EMAIL_COOKIE);
}

export function getAuthToken(): string | null {
  return getCookie(TOKEN_COOKIE);
}

export function getAuthRole(): string | null {
  return getCookie(ROLE_COOKIE);
}
