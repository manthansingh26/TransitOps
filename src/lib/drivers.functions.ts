import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getDrivers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("drivers").select("*").order("name");
    if (error) throw new Error(error.message);
    return data;
  });

export const getDriver = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: r, error } = await context.supabase.from("drivers").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return r;
  });

const driverSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  license_number: z.string().min(1).max(64),
  license_category: z.string().max(32).default(""),
  license_expiry_date: z.string().min(1),
  contact_number: z.string().max(32).default(""),
  safety_score: z.number().int().min(0).max(100),
  status: z.enum(["available", "on_trip", "off_duty", "suspended"]),
});

export const saveDriver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => driverSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...payload } = data;
    if (id) {
      const { error } = await context.supabase.from("drivers").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    } else {
      const { data: created, error } = await context.supabase.from("drivers").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      return { id: created.id };
    }
  });

export const deleteDriver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("drivers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
