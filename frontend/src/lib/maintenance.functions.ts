import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMaintenance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("maintenance_logs")
      .select("*, vehicle:vehicles(registration_number,model)")
      .order("opened_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const openMaintenance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    vehicle_id: z.string().uuid(),
    description: z.string().min(1),
    cost: z.number().nonnegative(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("open_maintenance", {
      _vehicle_id: data.vehicle_id,
      _description: data.description,
      _cost: data.cost,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const closeMaintenance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("close_maintenance", { _id: data.id });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
