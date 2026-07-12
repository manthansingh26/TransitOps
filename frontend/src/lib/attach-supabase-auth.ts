import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

// Project-specific bearer attacher. Unlike the generated attacher, this one
// falls back to reading the persisted session directly from localStorage when
// `getSession()` hasn't hydrated yet, so early server-fn calls after a hard
// reload don't race the async session restore.
function readTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("sb-") || !k.endsWith("-auth-token")) continue;
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const token = parsed?.access_token ?? parsed?.currentSession?.access_token;
      if (typeof token === "string" && token) return token;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token: string | null = null;
    try {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token ?? null;
    } catch {
      /* ignore */
    }
    if (!token) token = readTokenFromStorage();
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  },
);
