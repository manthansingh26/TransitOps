import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getReports } from "@/lib/reports.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Info } from "lucide-react";
import { money, num } from "@/lib/format";
import { downloadCSV } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const fn = useServerFn(getReports);
  const { data, isLoading } = useQuery({ queryKey: ["reports"], queryFn: () => fn() });
  if (isLoading || !data) return <div className="text-muted-foreground">Loading reports…</div>;

  const { perVehicle, fleet } = data;

  const exportCsv = () => downloadCSV("fleet-report.csv", perVehicle.map(r => ({
    Registration: r.registration_number, Model: r.model, Type: r.type, Status: r.status,
    Trips: r.trips, Distance_km: r.distance_km, Fuel_liters: r.fuel_liters, Fuel_cost: r.fuel_cost,
    Maintenance_cost: r.maintenance_cost, Expenses: r.expenses, Revenue: r.revenue,
    Op_cost: r.op_cost, Efficiency_km_per_l: r.efficiency_km_per_l ?? "", ROI: r.roi ?? "",
  })));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Includes fuel, maintenance, and expenses in Operational Cost.
            <TooltipProvider><UITooltip><TooltipTrigger asChild><Info className="h-3 w-3 inline" /></TooltipTrigger><TooltipContent>Revenue is manually entered per trip; ROI uses fuel + maintenance only.</TooltipContent></UITooltip></TooltipProvider>
          </p>
        </div>
        <Button onClick={exportCsv} variant="outline"><Download className="h-4 w-4 mr-1" />Export CSV</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Fleet utilization" value={`${fleet.utilization_pct}%`} />
        <Kpi label="Fleet fuel efficiency" value={fleet.fuel_efficiency ? `${num(fleet.fuel_efficiency, 2)} km/L` : "—"} />
        <Kpi label="Total operational cost" value={money(fleet.op_cost)} />
        <Kpi label="Total revenue (completed)" value={money(fleet.revenue)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Fuel efficiency by vehicle</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={perVehicle.filter(v => v.efficiency_km_per_l != null)}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="registration_number" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="efficiency_km_per_l" fill="#10b981" radius={[4, 4, 0, 0]} name="km/L" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cost breakdown by vehicle</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={perVehicle}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="registration_number" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="fuel_cost" stackId="a" fill="#3b82f6" name="Fuel" />
              <Bar dataKey="maintenance_cost" stackId="a" fill="#f59e0b" name="Maintenance" />
              <Bar dataKey="expenses" stackId="a" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Per-vehicle breakdown</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Trips</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Fuel</TableHead>
                <TableHead>Efficiency</TableHead>
                <TableHead>Fuel $</TableHead>
                <TableHead>Maint $</TableHead>
                <TableHead>Exp $</TableHead>
                <TableHead>Op cost</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perVehicle.map(r => (
                <TableRow key={r.vehicle_id}>
                  <TableCell className="font-medium">{r.registration_number}</TableCell>
                  <TableCell>{r.trips}</TableCell>
                  <TableCell>{num(r.distance_km)} km</TableCell>
                  <TableCell>{num(r.fuel_liters, 1)} L</TableCell>
                  <TableCell>{r.efficiency_km_per_l ? `${num(r.efficiency_km_per_l, 2)} km/L` : "—"}</TableCell>
                  <TableCell>{money(r.fuel_cost)}</TableCell>
                  <TableCell>{money(r.maintenance_cost)}</TableCell>
                  <TableCell>{money(r.expenses)}</TableCell>
                  <TableCell className="font-medium">{money(r.op_cost)}</TableCell>
                  <TableCell>{money(r.revenue)}</TableCell>
                  <TableCell>{r.roi != null ? `${(r.roi * 100).toFixed(1)}%` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </CardContent></Card>
  );
}
// silence unused import
void LineChart; void Line;
