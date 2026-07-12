/**
 * TransitOps API client — talks to the FastAPI backend.
 *
 * The JWT returned by the backend login endpoint is stored in localStorage
 * and attached to every request.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const TOKEN_KEY = "transitops_token";
const USER_KEY = "transitops_user";

export type AppRole =
  | "fleet_manager"
  | "driver"
  | "safety_officer"
  | "financial_analyst";

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  role: AppRole;
  is_active: boolean;
}

// ---- token / user storage ----
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function setStoredUser(user: AuthUser) {
  if (typeof window !== "undefined") localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ---- core request helper ----
async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; form?: URLSearchParams } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = options.form.toString();
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.detail) detail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    } catch {
      /* ignore */
    }
    if (res.status === 401) clearAuth();
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  postForm: <T>(path: string, form: URLSearchParams) =>
    request<T>(path, { method: "POST", form }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ---- auth ----
export async function login(email: string, password: string): Promise<AuthUser> {
  const form = new URLSearchParams({ username: email, password });
  const res = await api.postForm<{ access_token: string; user: AuthUser }>("/auth/login", form);
  setToken(res.access_token);
  setStoredUser(res.user);
  return res.user;
}

export async function signup(
  full_name: string,
  email: string,
  password: string,
  role: AppRole = "driver",
): Promise<AuthUser> {
  const res = await api.post<{ access_token: string; user: AuthUser }>("/auth/signup", {
    full_name,
    email,
    password,
    role,
  });
  setToken(res.access_token);
  setStoredUser(res.user);
  return res.user;
}

export function logout() {
  clearAuth();
}
