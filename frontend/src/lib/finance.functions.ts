import { api } from "@/lib/api";
import type { Vehicle } from "@/lib/vehicles.functions";

export interface FuelLog {
  id: number;
  vehicle_id: number;
  liters: number;
  cost: number;
  date: string;
  odometer_at_fill: number | null;
  created_at: string;
  vehicle?: Pick<Vehicle, "registration_number" | "model">;
}

export interface Expense {
  id: number;
  vehicle_id: number | null;
  category: "toll" | "fine" | "insurance" | "other";
  amount: number;
  date: string;
  description: string;
  created_at: string;
  vehicle?: Pick<Vehicle, "registration_number" | "model">;
}

export const getFuelLogs = () => api.get<FuelLog[]>("/fuel");

interface FuelInput {
  vehicle_id: number;
  liters: number;
  cost: number;
  date: string;
  odometer_at_fill?: number;
}

export const createFuelLog = async ({ data }: { data: FuelInput }) => {
  await api.post("/fuel", data);
  return { ok: true };
};

export const getExpenses = () => api.get<Expense[]>("/expenses");

interface ExpenseInput {
  vehicle_id?: number | null;
  category: "toll" | "fine" | "insurance" | "other";
  amount: number;
  date: string;
  description: string;
}

export const createExpense = async ({ data }: { data: ExpenseInput }) => {
  await api.post("/expenses", { ...data, vehicle_id: data.vehicle_id || null });
  return { ok: true };
};
