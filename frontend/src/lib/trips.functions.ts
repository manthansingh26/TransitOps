import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getTrips = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("trips")
      .select("*, vehicle:vehicles(registration_number,model,max_load_capacity_kg), driver:drivers(name,license_expiry_date)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const getTrip = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: t, error } = await context.supabase
      .from("trips")
      .select("*, vehicle:vehicles(*), driver:drivers(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const { data: events } = await context.supabase
      .from("trip_events")
      .select("*")
      .eq("trip_id", data.id)
      .order("created_at", { ascending: true });
    return { trip: t, events: events ?? [] };
  });

export const getEligibleForTrip = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: vehicles }, { data: drivers }] = await Promise.all([
      context.supabase.from("vehicles").select("id,registration_number,model,max_load_capacity_kg,type").eq("status", "available").order("registration_number"),
      context.supabase.from("drivers").select("id,name,license_expiry_date,license_number,status").eq("status", "available").gte("license_expiry_date", new Date().toISOString().slice(0, 10)).order("name"),
    ]);
    return { vehicles: vehicles ?? [], drivers: drivers ?? [] };
  });

export const createTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    source: z.string().min(1),
    destination: z.string().min(1),
    vehicle_id: z.string().uuid(),
    driver_id: z.string().uuid(),
    cargo_weight_kg: z.number().nonnegative(),
    planned_distance_km: z.number().nonnegative(),
    revenue: z.number().nonnegative().default(0),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("create_trip", {
      _source: data.source,
      _destination: data.destination,
      _vehicle_id: data.vehicle_id,
      _driver_id: data.driver_id,
      _cargo_weight_kg: data.cargo_weight_kg,
      _planned_distance_km: data.planned_distance_km,
      _revenue: data.revenue,
    });
    if (error) throw new Error(error.message);
    return { id };
  });

export const dispatchTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("dispatch_trip", { _trip_id: data.id });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const completeTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    actual_distance_km: z.number().nonnegative(),
    fuel_consumed_liters: z.number().nonnegative(),
    final_odometer: z.number().nonnegative(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("complete_trip", {
      _trip_id: data.id,
      _actual_distance_km: data.actual_distance_km,
      _fuel_consumed_liters: data.fuel_consumed_liters,
      _final_odometer: data.final_odometer,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("cancel_trip", { _trip_id: data.id });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
