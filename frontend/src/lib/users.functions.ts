import { api } from "@/lib/api";
import type { AppRole } from "@/lib/api";

export interface AppUser {
  id: number;
  email: string;
  full_name: string;
  role: AppRole | null;
}

export const listAppUsers = () => api.get<AppUser[]>("/users");

interface SetRoleInput {
  user_id: number;
  role: AppRole;
}

export const setUserRole = async ({ data }: { data: SetRoleInput }) => {
  await api.patch(`/users/${data.user_id}/role`, { role: data.role });
  return { ok: true };
};
