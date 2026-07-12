import { api } from "@/lib/api";
import type { Vehicle } from "@/lib/vehicles.functions";
import type { Driver } from "@/lib/drivers.functions";
import type { Trip } from "@/lib/trips.functions";
import type { FuelLog, Expense } from "@/lib/finance.functions";
import type { MaintenanceLog } from "@/lib/maintenance.functions";

/**
 * Reports are computed on the client from the raw list endpoints, preserving
 * the exact return shapes the route components expect.
 */
export const getDashboard = async () => {
  const [vehicles, drivers, trips] = await Promise.all([
    api.get<Vehicle[]>("/vehicles"),
    api.get<Driver[]>("/drivers"),
    api.get<Trip[]>("/trips"),
  ]);

  const nonRetired = vehicles.filter((v) => v.status !== "retired").length;
  const onTrip = vehicles.filter((v) => v.status === "on_trip").length;
  const kpis = {
    totalVehicles: vehicles.length,
    available: vehicles.filter((v) => v.status === "available").length,
    onTrip,
    inShop: vehicles.filter((v) => v.status === "in_shop").length,
    retired: vehicles.filter((v) => v.status === "retired").length,
    activeTrips: trips.filter((t) => t.status === "dispatched").length,
    draftTrips: trips.filter((t) => t.status === "draft").length,
    driversOnDuty: drivers.filter((d) => d.status === "on_trip").length,
    driversAvailable: drivers.filter((d) => d.status === "available").length,
    utilization: nonRetired > 0 ? Math.round((onTrip / nonRetired) * 100) : 0,
  };

  const byDay: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    byDay[d] = 0;
  }
  trips
    .filter((t) => new Date(t.created_at).getTime() >= Date.now() - 14 * 86400000)
    .forEach((t) => {
      const day = new Date(t.created_at).toISOString().slice(0, 10);
      if (day in byDay) byDay[day]++;
    });
  const tripsPerDay = Object.entries(byDay).map(([date, count]) => ({ date, count }));

  const statusBreakdown = [
    { name: "Available", value: kpis.available },
    { name: "On Trip", value: kpis.onTrip },
    { name: "In Shop", value: kpis.inShop },
    { name: "Retired", value: kpis.retired },
  ];

  return { kpis, tripsPerDay, statusBreakdown, vehicles, drivers };
};

export const getReports = async () => {
  const [vs, ts, fs, ms, es] = await Promise.all([
    api.get<Vehicle[]>("/vehicles"),
    api.get<Trip[]>("/trips"),
    api.get<FuelLog[]>("/fuel"),
    api.get<MaintenanceLog[]>("/maintenance"),
    api.get<Expense[]>("/expenses"),
  ]);

  const perVehicle = vs.map((v) => {
    const vt = ts.filter((t) => t.vehicle_id === v.id && t.status === "completed");
    const vf = fs.filter((f) => f.vehicle_id === v.id);
    const vm = ms.filter((m) => m.vehicle_id === v.id);
    const ve = es.filter((e) => e.vehicle_id === v.id);
    const distance = vt.reduce((a, t) => a + Number(t.actual_distance_km ?? 0), 0);
    const fuelLiters = vf.reduce((a, f) => a + Number(f.liters), 0);
    const fuelCost = vf.reduce((a, f) => a + Number(f.cost), 0);
    const maintCost = vm.reduce((a, m) => a + Number(m.cost), 0);
    const expCost = ve.reduce((a, e) => a + Number(e.amount), 0);
    const revenue = vt.reduce((a, t) => a + Number(t.revenue ?? 0), 0);
    const opCost = fuelCost + maintCost + expCost;
    const efficiency = fuelLiters > 0 ? distance / fuelLiters : null;
    const roi =
      Number(v.acquisition_cost) > 0
        ? (revenue - (fuelCost + maintCost)) / Number(v.acquisition_cost)
        : null;
    return {
      vehicle_id: v.id,
      registration_number: v.registration_number,
      model: v.model,
      type: v.type,
      status: v.status,
      trips: vt.length,
      distance_km: distance,
      fuel_liters: fuelLiters,
      fuel_cost: fuelCost,
      maintenance_cost: maintCost,
      expenses: expCost,
      revenue,
      op_cost: opCost,
      efficiency_km_per_l: efficiency,
      roi,
    };
  });

  const fleetDistance = perVehicle.reduce((a, r) => a + r.distance_km, 0);
  const fleetFuel = perVehicle.reduce((a, r) => a + r.fuel_liters, 0);
  const nonRetired = vs.filter((v) => v.status !== "retired").length;
  const onTrip = vs.filter((v) => v.status === "on_trip").length;
  const fleet = {
    utilization_pct: nonRetired > 0 ? Math.round((onTrip / nonRetired) * 100) : 0,
    fuel_efficiency: fleetFuel > 0 ? fleetDistance / fleetFuel : null,
    op_cost: perVehicle.reduce((a, r) => a + r.op_cost, 0),
    revenue: perVehicle.reduce((a, r) => a + r.revenue, 0),
  };

  return { perVehicle, fleet };
};
