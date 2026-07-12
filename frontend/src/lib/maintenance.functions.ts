import { api } from "@/lib/api";
import type { Vehicle } from "@/lib/vehicles.functions";

export interface MaintenanceLog {
  id: number;
  vehicle_id: number;
  description: string;
  cost: number;
  status: "active" | "closed";
  opened_at: string;
  closed_at: string | null;
  vehicle?: Pick<Vehicle, "registration_number" | "model">;
}

export const getMaintenance = () => api.get<MaintenanceLog[]>("/maintenance");

interface OpenMaintenanceInput {
  vehicle_id: number;
  description: string;
  cost: number;
}

export const openMaintenance = async ({ data }: { data: OpenMaintenanceInput }) => {
  await api.post("/maintenance", data);
  return { ok: true };
};

export const closeMaintenance = async ({ data }: { data: { id: number } }) => {
  await api.post(`/maintenance/${data.id}/close`);
  return { ok: true };
};
