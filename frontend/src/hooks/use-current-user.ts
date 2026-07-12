import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export function useCurrentUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load(u: User | null) {
      if (!u) { setRole(null); setLoading(false); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.id).limit(1).maybeSingle();
      if (!mounted) return;
      setRole((data?.role as AppRole) ?? null);
      setLoading(false);
    }
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user);
      load(data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setLoading(true);
      load(session?.user ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return { user, role, loading };
}

export const roleLabel = (r: AppRole | null) => {
  switch (r) {
    case "fleet_manager": return "Fleet Manager";
    case "driver": return "Driver";
    case "safety_officer": return "Safety Officer";
    case "financial_analyst": return "Financial Analyst";
    default: return "—";
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
