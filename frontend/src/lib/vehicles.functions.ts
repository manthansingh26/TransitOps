import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getVehicles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("vehicles").select("*").order("registration_number");
    if (error) throw new Error(error.message);
    return data;
  });

export const getVehicle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: v, error } = await context.supabase.from("vehicles").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return v;
  });

const vehicleSchema = z.object({
  id: z.string().uuid().optional(),
  registration_number: z.string().min(1).max(32),
  model: z.string().min(1).max(100),
  type: z.enum(["truck", "van", "bike", "car"]),
  max_load_capacity_kg: z.number().positive(),
  odometer: z.number().nonnegative().default(0),
  acquisition_cost: z.number().nonnegative().default(0),
  status: z.enum(["available", "on_trip", "in_shop", "retired"]),
  region: z.string().max(64).default(""),
});

export const saveVehicle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => vehicleSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...payload } = data;
    if (id) {
      const { error } = await context.supabase.from("vehicles").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    } else {
      const { data: created, error } = await context.supabase.from("vehicles").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      return { id: created.id };
    }
  });

export const deleteVehicle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("vehicles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
