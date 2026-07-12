import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getVehicles, saveVehicle, deleteVehicle } from "@/lib/vehicles.functions";
import { useCurrentUser, can } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VehicleStatusBadge } from "@/components/status-badges";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { money, num } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/vehicles")({
  component: VehiclesPage,
});

type Vehicle = Awaited<ReturnType<typeof getVehicles>>[number];

function VehiclesPage() {
  const { role } = useCurrentUser();
  const fn = useServerFn(getVehicles);
  const { data = [], isLoading } = useQuery({ queryKey: ["vehicles"], queryFn: () => fn() });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [editing, setEditing] = useState<Vehicle | null | undefined>(undefined);

  const filtered = useMemo(() => data.filter((v) =>
    (status === "all" || v.status === status) &&
    (type === "all" || v.type === type) &&
    (search === "" || v.registration_number.toLowerCase().includes(search.toLowerCase()) || v.model.toLowerCase().includes(search.toLowerCase()) || v.region.toLowerCase().includes(search.toLowerCase()))
  ), [data, search, status, type]);

  const writable = can.writeVehicles(role);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Vehicles</h1>
          <p className="text-sm text-muted-foreground">{data.length} in registry</p>
        </div>
        {writable && (
          <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-1" />New vehicle</Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search…" className="pl-8 w-64" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="on_trip">On Trip</SelectItem>
            <SelectItem value="in_shop">In Shop</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="truck">Truck</SelectItem>
            <SelectItem value="van">Van</SelectItem>
            <SelectItem value="bike">Bike</SelectItem>
            <SelectItem value="car">Car</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Registration</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Capacity (kg)</TableHead>
              <TableHead>Odometer</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>}
            {!isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No vehicles</TableCell></TableRow>}
            {filtered.map(v => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.registration_number}</TableCell>
                <TableCell>{v.model}</TableCell>
                <TableCell className="capitalize">{v.type}</TableCell>
                <TableCell>{num(v.max_load_capacity_kg)}</TableCell>
                <TableCell>{num(v.odometer)}</TableCell>
                <TableCell>{v.region || "—"}</TableCell>
                <TableCell>{money(v.acquisition_cost)}</TableCell>
                <TableCell><VehicleStatusBadge status={v.status} /></TableCell>
                <TableCell className="text-right">
                  {writable && (
                    <Button size="sm" variant="ghost" onClick={() => setEditing(v)}><Pencil className="h-4 w-4" /></Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {writable && editing !== undefined && (
        <VehicleDialog vehicle={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}

function VehicleDialog({ vehicle, onClose }: { vehicle: Vehicle | null; onClose: () => void }) {
  const qc = useQueryClient();
  const save = useServerFn(saveVehicle);
  const del = useServerFn(deleteVehicle);
  const navigate = useNavigate();
  void navigate;
  void Link;
  const [form, setForm] = useState({
    registration_number: vehicle?.registration_number ?? "",
    model: vehicle?.model ?? "",
    type: vehicle?.type ?? "truck",
    max_load_capacity_kg: vehicle?.max_load_capacity_kg?.toString() ?? "",
    odometer: vehicle?.odometer?.toString() ?? "0",
    acquisition_cost: vehicle?.acquisition_cost?.toString() ?? "0",
    status: vehicle?.status ?? "available",
    region: vehicle?.region ?? "",
  });

  const saveM = useMutation({
    mutationFn: () => save({ data: {
      id: vehicle?.id,
      registration_number: form.registration_number.trim(),
      model: form.model.trim(),
      type: form.type as "truck" | "van" | "bike" | "car",
      max_load_capacity_kg: Number(form.max_load_capacity_kg),
      odometer: Number(form.odometer),
      acquisition_cost: Number(form.acquisition_cost),
      status: form.status as "available" | "on_trip" | "in_shop" | "retired",
      region: form.region.trim(),
    } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries(); onClose(); },
    onError: (e) => toast.error(prettyErr(e)),
  });

  const delM = useMutation({
    mutationFn: () => del({ data: { id: vehicle!.id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries(); onClose(); },
    onError: (e) => toast.error(prettyErr(e)),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Edit vehicle" : "New vehicle"}</DialogTitle>
          <DialogDescription>Vehicle statuses that conflict with active work (e.g. an active maintenance record) can't be overridden here.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveM.mutate(); }} className="grid grid-cols-2 gap-3">
          <Field label="Registration"><Input required value={form.registration_number} onChange={e => setForm({ ...form, registration_number: e.target.value })} /></Field>
          <Field label="Model"><Input required value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></Field>
          <Field label="Type">
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as typeof form.type })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="truck">Truck</SelectItem>
                <SelectItem value="van">Van</SelectItem>
                <SelectItem value="bike">Bike</SelectItem>
                <SelectItem value="car">Car</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as typeof form.status })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="off_duty" disabled>—</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Max load (kg)"><Input type="number" required min={1} value={form.max_load_capacity_kg} onChange={e => setForm({ ...form, max_load_capacity_kg: e.target.value })} /></Field>
          <Field label="Odometer"><Input type="number" min={0} value={form.odometer} onChange={e => setForm({ ...form, odometer: e.target.value })} /></Field>
          <Field label="Acquisition cost"><Input type="number" min={0} value={form.acquisition_cost} onChange={e => setForm({ ...form, acquisition_cost: e.target.value })} /></Field>
          <Field label="Region"><Input value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} /></Field>
          <DialogFooter className="col-span-2 mt-2">
            {vehicle && <Button type="button" variant="destructive" onClick={() => delM.mutate()} disabled={delM.isPending}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>}
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saveM.isPending}>{saveM.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="text-xs">{label}</Label>{children}</div>;
}

export function prettyErr(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/duplicate key/i.test(msg) && /registration/i.test(msg)) return "A vehicle with that registration already exists";
  if (/duplicate key/i.test(msg) && /license/i.test(msg)) return "A driver with that license number already exists";
  return msg;
}
