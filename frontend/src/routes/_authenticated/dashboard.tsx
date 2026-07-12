import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/reports.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import { Truck, Users, Wrench, Route as RouteIcon, TrendingUp, Circle } from "lucide-react";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#6b7280"];

function Dashboard() {
  const fn = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (!data) return null;
    const vs = data.vehicles.filter((v) =>
      (typeFilter === "all" || v.type === typeFilter) &&
      (regionFilter === "all" || v.region === regionFilter)
    );
    const nonRetired = vs.filter((v) => v.status !== "retired").length;
    const onTrip = vs.filter((v) => v.status === "on_trip").length;
    return {
      totalVehicles: vs.length,
      available: vs.filter((v) => v.status === "available").length,
      onTrip,
      inShop: vs.filter((v) => v.status === "in_shop").length,
      retired: vs.filter((v) => v.status === "retired").length,
      utilization: nonRetired > 0 ? Math.round((onTrip / nonRetired) * 100) : 0,
    };
  }, [data, typeFilter, regionFilter]);

  const regions = useMemo(() => Array.from(new Set((data?.vehicles ?? []).map(v => v.region).filter(Boolean))), [data]);

  if (isLoading || !data || !filtered) return <Spinner label="Loading dashboard…" />;
  const k = data.kpis;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Fleet overview at a glance</p>
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="truck">Truck</SelectItem>
              <SelectItem value="van">Van</SelectItem>
              <SelectItem value="bike">Bike</SelectItem>
              <SelectItem value="car">Car</SelectItem>
            </SelectContent>
          </Select>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Region" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={Truck} label="Vehicles (filtered)" value={filtered.totalVehicles} sub={`${filtered.available} available`} />
        <Kpi icon={RouteIcon} label="Active trips" value={k.activeTrips} sub={`${k.draftTrips} draft`} accent="blue" />
        <Kpi icon={Wrench} label="In maintenance" value={filtered.inShop} accent="orange" />
        <Kpi icon={TrendingUp} label="Utilization" value={`${filtered.utilization}%`} sub={`${filtered.onTrip} on trip / ${filtered.totalVehicles - filtered.retired} active`} accent="green" />
        <Kpi icon={Users} label="Drivers on duty" value={k.driversOnDuty} sub={`${k.driversAvailable} available`} accent="blue" />
        <Kpi icon={Circle} label="Available vehicles" value={filtered.available} accent="green" />
        <Kpi icon={Wrench} label="Retired" value={filtered.retired} accent="gray" />
        <Kpi icon={RouteIcon} label="Draft trips" value={k.draftTrips} accent="gray" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Trips per day (last 14)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.tripsPerDay}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Fleet status breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.statusBreakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                  {data.statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, accent }: { icon: typeof Truck; label: string; value: string | number; sub?: string; accent?: "blue" | "green" | "orange" | "gray" }) {
  const tone = {
    blue: { text: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/30" },
    green: { text: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
    orange: { text: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/30" },
    gray: { text: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800/50" },
  }[accent ?? "gray"] ?? { text: "text-primary", bg: "bg-primary/10" };
  return (
    <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone.bg}`}>
            <Icon className={`h-4 w-4 ${tone.text}`} />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export const VehicleStatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    available: { label: "Available", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    on_trip: { label: "On Trip", cls: "bg-blue-100 text-blue-800 border-blue-200" },
    in_shop: { label: "In Shop", cls: "bg-amber-100 text-amber-800 border-amber-200" },
    retired: { label: "Retired", cls: "bg-gray-100 text-gray-700 border-gray-200" },
  };
  const s = map[status] ?? { label: status, cls: "" };
  return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
};
