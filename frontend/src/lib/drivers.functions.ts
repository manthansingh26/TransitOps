import { api } from "@/lib/api";

export interface Driver {
  id: number;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  contact_number: string;
  safety_score: number;
  status: "available" | "on_trip" | "off_duty" | "suspended";
  license_is_valid: boolean;
  created_at: string;
}

export const getDrivers = () => api.get<Driver[]>("/drivers");

export const getDriver = ({ data }: { data: { id: number } }) =>
  api.get<Driver>(`/drivers/${data.id}`);

interface DriverInput {
  id?: number;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  contact_number: string;
  safety_score: number;
  status: "available" | "on_trip" | "off_duty" | "suspended";
}

export const saveDriver = async ({ data }: { data: DriverInput }) => {
  const { id, ...payload } = data;
  if (id) {
    await api.patch(`/drivers/${id}`, payload);
    return { id };
  }
  const created = await api.post<Driver>("/drivers", payload);
  return { id: created.id };
};

export const deleteDriver = async ({ data }: { data: { id: number } }) => {
  await api.del(`/drivers/${data.id}`);
  return { ok: true };
};
