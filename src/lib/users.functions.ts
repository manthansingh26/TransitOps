import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listAppUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Only managers can see all
    const { data: isManager } = await context.supabase.rpc("has_role", {
      _user_id: context.userId, _role: "fleet_manager",
    });
    if (!isManager) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const ids = users?.users.map((u) => u.id) ?? [];
    const { data: roles } = await context.supabase.from("user_roles").select("user_id,role").in("user_id", ids);
    const { data: profiles } = await context.supabase.from("profiles").select("id,full_name").in("id", ids);
    return (users?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      full_name: profiles?.find((p) => p.id === u.id)?.full_name ?? "",
      role: roles?.find((r) => r.user_id === u.id)?.role ?? null,
    }));
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    user_id: z.string().uuid(),
    role: z.enum(["fleet_manager", "driver", "safety_officer", "financial_analyst"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isManager } = await context.supabase.rpc("has_role", {
      _user_id: context.userId, _role: "fleet_manager",
    });
    if (!isManager) throw new Error("Forbidden");
    await context.supabase.from("user_roles").delete().eq("user_id", data.user_id);
    const { error } = await context.supabase.from("user_roles").insert({ user_id: data.user_id, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
