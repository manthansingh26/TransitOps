import { api } from "@/lib/api";

export interface Trip {
  id: number;
  source: string;
  destination: string;
  vehicle_id: number;
  driver_id: number;
  cargo_weight_kg: number;
  planned_distance_km: number;
  actual_distance_km: number | null;
  fuel_consumed_liters: number | null;
  revenue: number;
  status: "draft" | "dispatched" | "completed" | "cancelled";
  created_by: number | null;
  dispatched_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  vehicle?: { registration_number: string; model: string; max_load_capacity_kg: number };
  driver?: { name: string; license_expiry_date: string };
}

export interface TripEvent {
  id: number;
  trip_id: number;
  event: string;
  note: string;
  actor_id: number | null;
  created_at: string;
}

export const getTrips = () => api.get<Trip[]>("/trips");

export const getTrip = ({ data }: { data: { id: number } }) =>
  api.get<{ trip: Trip; events: TripEvent[] }>(`/trips/${data.id}`);

export const getEligibleForTrip = () =>
  api.get<{
    vehicles: {
      id: number;
      registration_number: string;
      model: string;
      max_load_capacity_kg: number;
      type: string;
    }[];
    drivers: {
      id: number;
      name: string;
      license_expiry_date: string;
      license_number: string;
      status: string;
    }[];
  }>("/trips/meta/eligible");

interface CreateTripInput {
  source: string;
  destination: string;
  vehicle_id: number;
  driver_id: number;
  cargo_weight_kg: number;
  planned_distance_km: number;
  revenue: number;
}

export const createTrip = async ({ data }: { data: CreateTripInput }) => {
  const created = await api.post<Trip>("/trips", data);
  return { id: created.id };
};

export const dispatchTrip = async ({ data }: { data: { id: number } }) => {
  await api.post(`/trips/${data.id}/dispatch`);
  return { ok: true };
};

interface CompleteTripInput {
  id: number;
  actual_distance_km: number;
  fuel_consumed_liters: number;
  final_odometer: number;
}

export const completeTrip = async ({ data }: { data: CompleteTripInput }) => {
  const { id, ...payload } = data;
  await api.post(`/trips/${id}/complete`, payload);
  return { ok: true };
};

export const cancelTrip = async ({ data }: { data: { id: number } }) => {
  await api.post(`/trips/${data.id}/cancel`);
  return { ok: true };
};
