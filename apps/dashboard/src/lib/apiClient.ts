import type { ApiResponse, AuthTokens } from "@app/shared";

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
).replace(/\/$/, "");
const API_PREFIX = "/api";

// ── Token helpers ──────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dash_access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dash_refresh_token");
}

export function setTokens(tokens: AuthTokens): void {
  localStorage.setItem("dash_access_token", tokens.accessToken);
  localStorage.setItem("dash_refresh_token", tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem("dash_access_token");
  localStorage.removeItem("dash_refresh_token");
}

// ── Singleton refresh promise — prevents concurrent refresh races ──────────────

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async (): Promise<boolean> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${BASE_URL}${API_PREFIX}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        clearTokens();
        return false;
      }

      const json = (await res.json()) as ApiResponse<AuthTokens>;
      if (json.success && json.data) {
        setTokens(json.data);
        return true;
      }

      clearTokens();
      return false;
    } catch {
      clearTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ── Core fetch ─────────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${API_PREFIX}${path}`;
  const isFormData = options.body instanceof FormData;

  const headers = new Headers(options.headers as HeadersInit | undefined);
  if (!isFormData) headers.set("Content-Type", "application/json");

  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    return {
      success: false,
      data: null as unknown as T,
      message: "Unable to reach the server. Please try again later.",
      statusCode: 0,
    };
  }

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const newToken = getAccessToken();
      if (newToken) headers.set("Authorization", `Bearer ${newToken}`);
      try {
        res = await fetch(url, { ...options, headers });
      } catch {
        return {
          success: false,
          data: null as unknown as T,
          message: "Unable to reach the server. Please try again later.",
          statusCode: 0,
        };
      }
    }
  }

  if (res.status >= 500) {
    return {
      success: false,
      data: null as unknown as T,
      message: "An unexpected server error occurred. Please try again.",
      statusCode: res.status,
    };
  }

  return res.json() as Promise<ApiResponse<T>>;
}

// ── Public API ─────────────────────────────────────────────────────────────────

export const apiClient = {
  get<T>(path: string): Promise<ApiResponse<T>> {
    return request<T>(path, { method: "GET" });
  },

  post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string): Promise<ApiResponse<T>> {
    return request<T>(path, { method: "DELETE" });
  },

  upload<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
    return request<T>(path, { method: "POST", body: formData });
  },

  patchUpload<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
    return request<T>(path, { method: "PATCH", body: formData });
  },
};
