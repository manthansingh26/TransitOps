import { useEffect, useState } from "react";
import { getStoredUser, getToken, type AppRole, type AuthUser } from "@/lib/api";

export type { AppRole };

export function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();
    if (token && stored) {
      setUser(stored);
      setRole(stored.role);
    } else {
      setUser(null);
      setRole(null);
    }
    setLoading(false);
  }, []);

  return { user, role, loading };
}

export const roleLabel = (r: AppRole | null) => {
  switch (r) {
    case "fleet_manager":
      return "Fleet Manager";
    case "driver":
      return "Driver";
    case "safety_officer":
      return "Safety Officer";
    case "financial_analyst":
      return "Financial Analyst";
    default:
      return "—";
  }
};

export const can = {
  writeVehicles: (r: AppRole | null) => r === "fleet_manager",
  writeDrivers: (r: AppRole | null) => r === "fleet_manager" || r === "safety_officer",
  createTrips: (r: AppRole | null) => r === "fleet_manager" || r === "driver",
  dispatchTrips: (r: AppRole | null) => r === "fleet_manager",
  writeMaintenance: (r: AppRole | null) => r === "fleet_manager",
  writeFinance: (r: AppRole | null) => r === "fleet_manager" || r === "financial_analyst",
  manageUsers: (r: AppRole | null) => r === "fleet_manager",
};
