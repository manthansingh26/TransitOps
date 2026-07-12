import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTrips, getEligibleForTrip, createTrip, dispatchTrip, completeTrip, cancelTrip, getTrip } from "@/lib/trips.functions";
import { useCurrentUser, can } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TripStatusBadge } from "@/components/status-badges";
import { Plus, Search, Play, CheckCircle, XCircle, Eye, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { datetime, num, money } from "@/lib/format";
import { prettyErr } from "./vehicles";

export const Route = createFileRoute("/_authenticated/trips")({
  component: TripsPage,
});

function TripsPage() {
  const { role } = useCurrentUser();
  const fn = useServerFn(getTrips);
  const { data = [], isLoading } = useQuery({ queryKey: ["trips"], queryFn: () => fn() });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  const filtered = useMemo(() => data.filter(t =>
    (status === "all" || t.status === status) &&
    (search === "" || t.source.toLowerCase().includes(search.toLowerCase()) || t.destination.toLowerCase().includes(search.toLowerCase()))
  ), [data, search, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Trips</h1>
          <p className="text-sm text-muted-foreground">Create, dispatch, complete, and cancel trips</p>
        </div>
        {can.createTrips(role) && <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" />New trip</Button>}
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search source or destination…" className="pl-8 w-72" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="dispatched">Dispatched</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Route</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Distance</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>}
            {!isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No trips</TableCell></TableRow>}
            {filtered.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.source} → {t.destination}</TableCell>
                <TableCell>{t.vehicle?.registration_number ?? "—"}</TableCell>
                <TableCell>{t.driver?.name ?? "—"}</TableCell>
                <TableCell>{num(t.cargo_weight_kg)} kg</TableCell>
                <TableCell>{num(t.actual_distance_km ?? t.planned_distance_km)} km</TableCell>
                <TableCell>{money(t.revenue)}</TableCell>
                <TableCell><TripStatusBadge status={t.status} /></TableCell>
                <TableCell>{datetime(t.created_at)}</TableCell>
                <TableCell className="text-right">
                  <TripActions trip={t} role={role} onView={() => setViewing(t.id)} onComplete={() => setCompleting(t.id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {creating && <NewTripDialog onClose={() => setCreating(false)} />}
      {viewing && <TripDetailDialog id={viewing} onClose={() => setViewing(null)} />}
      {completing && <CompleteTripDialog id={completing} onClose={() => setCompleting(null)} />}
    </div>
  );
}

function TripActions({ trip, role, onView, onComplete }: { trip: Awaited<ReturnType<typeof getTrips>>[number]; role: ReturnType<typeof useCurrentUser>["role"]; onView: () => void; onComplete: () => void }) {
  const qc = useQueryClient();
  const dispatch = useServerFn(dispatchTrip);
  const cancel = useServerFn(cancelTrip);
  const dispatchM = useMutation({ mutationFn: () => dispatch({ data: { id: trip.id } }), onSuccess: () => { toast.success("Dispatched"); qc.invalidateQueries(); }, onError: (e) => toast.error(prettyErr(e)) });
  const cancelM = useMutation({ mutationFn: () => cancel({ data: { id: trip.id } }), onSuccess: () => { toast.success("Cancelled"); qc.invalidateQueries(); }, onError: (e) => toast.error(prettyErr(e)) });
  const canDispatch = can.dispatchTrips(role);
  return (
    <div className="flex justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={onView}><Eye className="h-4 w-4" /></Button>
      {canDispatch && trip.status === "draft" && <Button size="sm" variant="ghost" onClick={() => dispatchM.mutate()} disabled={dispatchM.isPending} title="Dispatch"><Play className="h-4 w-4 text-blue-600" /></Button>}
      {canDispatch && trip.status === "dispatched" && <Button size="sm" variant="ghost" onClick={onComplete} title="Complete"><CheckCircle className="h-4 w-4 text-emerald-600" /></Button>}
      {canDispatch && (trip.status === "draft" || trip.status === "dispatched") && <Button size="sm" variant="ghost" onClick={() => cancelM.mutate()} disabled={cancelM.isPending} title="Cancel"><XCircle className="h-4 w-4 text-red-600" /></Button>}
    </div>
  );
}

function NewTripDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const eligFn = useServerFn(getEligibleForTrip);
  const create = useServerFn(createTrip);
  const { data: eligible } = useQuery({ queryKey: ["eligible-trip"], queryFn: () => eligFn() });
  const [form, setForm] = useState({ source: "", destination: "", vehicle_id: "", driver_id: "", cargo_weight_kg: "", planned_distance_km: "", revenue: "0" });

  const selectedVehicle = eligible?.vehicles.find(v => v.id === form.vehicle_id);
  const overCapacity = selectedVehicle && Number(form.cargo_weight_kg) > selectedVehicle.max_load_capacity_kg;

  const m = useMutation({
    mutationFn: () => create({ data: {
      source: form.source.trim(), destination: form.destination.trim(),
      vehicle_id: form.vehicle_id, driver_id: form.driver_id,
      cargo_weight_kg: Number(form.cargo_weight_kg),
      planned_distance_km: Number(form.planned_distance_km),
      revenue: Number(form.revenue),
    } }),
    onSuccess: () => { toast.success("Trip created (draft)"); qc.invalidateQueries(); onClose(); },
    onError: (e) => toast.error(prettyErr(e)),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New trip</DialogTitle>
          <DialogDescription>Only available vehicles and drivers with valid licenses are listed. A Fleet Manager must dispatch the trip.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Source</Label><Input required value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} /></div>
          <div><Label className="text-xs">Destination</Label><Input required value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} /></div>
          <div className="col-span-2">
            <Label className="text-xs">Vehicle</Label>
            <Select value={form.vehicle_id} onValueChange={v => setForm({ ...form, vehicle_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select an available vehicle" /></SelectTrigger>
              <SelectContent>
                {eligible?.vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.registration_number} — {v.model} (max {num(v.max_load_capacity_kg)} kg)</SelectItem>)}
                {eligible?.vehicles.length === 0 && <div className="text-sm text-muted-foreground p-2">No available vehicles</div>}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Driver</Label>
            <Select value={form.driver_id} onValueChange={v => setForm({ ...form, driver_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select an eligible driver" /></SelectTrigger>
              <SelectContent>
                {eligible?.drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name} — {d.license_number}</SelectItem>)}
                {eligible?.drivers.length === 0 && <div className="text-sm text-muted-foreground p-2">No eligible drivers</div>}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Cargo weight (kg)</Label><Input type="number" required min={0} value={form.cargo_weight_kg} onChange={e => setForm({ ...form, cargo_weight_kg: e.target.value })} /></div>
          <div><Label className="text-xs">Planned distance (km)</Label><Input type="number" required min={0} value={form.planned_distance_km} onChange={e => setForm({ ...form, planned_distance_km: e.target.value })} /></div>
          <div className="col-span-2"><Label className="text-xs">Revenue (manually entered)</Label><Input type="number" min={0} value={form.revenue} onChange={e => setForm({ ...form, revenue: e.target.value })} /></div>
          {overCapacity && <div className="col-span-2 flex items-center gap-2 text-sm text-red-600"><AlertTriangle className="h-4 w-4" />Cargo exceeds vehicle capacity ({num(selectedVehicle!.max_load_capacity_kg)} kg)</div>}
          <DialogFooter className="col-span-2 mt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={m.isPending || Boolean(overCapacity)}>{m.isPending ? "Creating…" : "Create draft"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TripDetailDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const fn = useServerFn(getTrip);
  const { data } = useQuery({ queryKey: ["trip", id], queryFn: () => fn({ data: { id } }) });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Trip detail</DialogTitle></DialogHeader>
        {!data && <div className="text-muted-foreground">Loading…</div>}
        {data?.trip && (
          <div className="space-y-3 text-sm">
            <div className="font-medium">{data.trip.source} → {data.trip.destination}</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Info label="Status"><TripStatusBadge status={data.trip.status} /></Info>
              <Info label="Vehicle">{data.trip.vehicle?.registration_number} — {data.trip.vehicle?.model}</Info>
              <Info label="Driver">{data.trip.driver?.name}</Info>
              <Info label="Cargo">{num(data.trip.cargo_weight_kg)} kg</Info>
              <Info label="Planned distance">{num(data.trip.planned_distance_km)} km</Info>
              <Info label="Actual distance">{data.trip.actual_distance_km ? `${num(data.trip.actual_distance_km)} km` : "—"}</Info>
              <Info label="Fuel consumed">{data.trip.fuel_consumed_liters ? `${num(data.trip.fuel_consumed_liters)} L` : "—"}</Info>
              <Info label="Revenue">{money(data.trip.revenue)}</Info>
            </div>
            <div className="border-t pt-3">
              <div className="font-medium mb-2">Timeline</div>
              <ol className="space-y-1 text-xs">
                {data.events.map(e => (
                  <li key={e.id} className="flex justify-between border-b py-1">
                    <span className="capitalize font-medium">{e.event}</span>
                    <span className="text-muted-foreground">{datetime(e.created_at)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-muted-foreground">{label}</div><div className="mt-0.5">{children}</div></div>;
}

function CompleteTripDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const complete = useServerFn(completeTrip);
  const [form, setForm] = useState({ actual_distance_km: "", fuel_consumed_liters: "", final_odometer: "" });
  const m = useMutation({
    mutationFn: () => complete({ data: {
      id, actual_distance_km: Number(form.actual_distance_km),
      fuel_consumed_liters: Number(form.fuel_consumed_liters), final_odometer: Number(form.final_odometer)
    } }),
    onSuccess: () => { toast.success("Trip completed"); qc.invalidateQueries(); onClose(); },
    onError: (e) => toast.error(prettyErr(e)),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Complete trip</DialogTitle><DialogDescription>Enter final trip data. Vehicle and driver will return to Available.</DialogDescription></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-3">
          <div><Label className="text-xs">Actual distance (km)</Label><Input type="number" required min={0} value={form.actual_distance_km} onChange={e => setForm({ ...form, actual_distance_km: e.target.value })} /></div>
          <div><Label className="text-xs">Fuel consumed (L)</Label><Input type="number" required min={0} step="0.1" value={form.fuel_consumed_liters} onChange={e => setForm({ ...form, fuel_consumed_liters: e.target.value })} /></div>
          <div><Label className="text-xs">Final odometer</Label><Input type="number" required min={0} value={form.final_odometer} onChange={e => setForm({ ...form, final_odometer: e.target.value })} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={m.isPending}>{m.isPending ? "Completing…" : "Complete"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
