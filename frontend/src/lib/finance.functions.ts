import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getFuelLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("fuel_logs")
      .select("*, vehicle:vehicles(registration_number,model)")
      .order("date", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const createFuelLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    vehicle_id: z.string().uuid(),
    liters: z.number().positive(),
    cost: z.number().nonnegative(),
    date: z.string(),
    odometer_at_fill: z.number().nonnegative().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("fuel_logs").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getExpenses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("expenses")
      .select("*, vehicle:vehicles(registration_number,model)")
      .order("date", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const createExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    vehicle_id: z.string().uuid().nullable().optional(),
    category: z.enum(["toll", "fine", "insurance", "other"]),
    amount: z.number().nonnegative(),
    date: z.string(),
    description: z.string().max(500).default(""),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("expenses").insert({
      ...data,
      vehicle_id: data.vehicle_id || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
