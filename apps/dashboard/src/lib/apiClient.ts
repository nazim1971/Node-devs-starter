import type { AuthTokens } from "@app/shared";
import { createApiClient } from "@app/shared";

// ── Token helpers ──────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dash_access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dash_refresh_token");
}

const COOKIE_MAX_AGE = 15 * 60; // matches JWT_ACCESS_EXPIRES (15m)

export function setTokens(tokens: AuthTokens): void {
  localStorage.setItem("dash_access_token", tokens.accessToken);
  localStorage.setItem("dash_refresh_token", tokens.refreshToken);
  // Mirror into a cookie so Next.js middleware can verify the JWT
  document.cookie = `dash_access_token=${tokens.accessToken}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Strict`;
}

export function clearTokens(): void {
  localStorage.removeItem("dash_access_token");
  localStorage.removeItem("dash_refresh_token");
  document.cookie = "dash_access_token=; path=/; max-age=0; SameSite=Strict";
}

// ── Client ─────────────────────────────────────────────────────────────────────

export const apiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  getAccessToken,
  getRefreshToken,
  onTokensRefreshed: setTokens,
  onAuthFailure: () => {
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },
});
