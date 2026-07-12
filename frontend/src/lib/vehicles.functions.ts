import { api } from "@/lib/api";

export interface Vehicle {
  id: number;
  registration_number: string;
  model: string;
  type: "truck" | "van" | "bike" | "car";
  max_load_capacity_kg: number;
  odometer: number;
  acquisition_cost: number;
  status: "available" | "on_trip" | "in_shop" | "retired";
  region: string;
  revenue: number;
  created_at: string;
}

export const getVehicles = () => api.get<Vehicle[]>("/vehicles");

export const getVehicle = ({ data }: { data: { id: number } }) =>
  api.get<Vehicle>(`/vehicles/${data.id}`);

interface VehicleInput {
  id?: number;
  registration_number: string;
  model: string;
  type: "truck" | "van" | "bike" | "car";
  max_load_capacity_kg: number;
  odometer: number;
  acquisition_cost: number;
  status: "available" | "on_trip" | "in_shop" | "retired";
  region: string;
}

export const saveVehicle = async ({ data }: { data: VehicleInput }) => {
  const { id, ...payload } = data;
  if (id) {
    await api.patch(`/vehicles/${id}`, payload);
    return { id };
  }
  const created = await api.post<Vehicle>("/vehicles", payload);
  return { id: created.id };
};

export const deleteVehicle = async ({ data }: { data: { id: number } }) => {
  await api.del(`/vehicles/${data.id}`);
  return { ok: true };
};
