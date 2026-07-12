import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMaintenance, openMaintenance, closeMaintenance } from "@/lib/maintenance.functions";
import { getVehicles } from "@/lib/vehicles.functions";
import { useCurrentUser, can } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaintenanceStatusBadge } from "@/components/status-badges";
import { Plus, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { date, money } from "@/lib/format";
import { prettyErr } from "./vehicles";

export const Route = createFileRoute("/_authenticated/maintenance")({
  component: MaintenancePage,
});

function MaintenancePage() {
  const { role } = useCurrentUser();
  const fn = useServerFn(getMaintenance);
  const { data = [], isLoading } = useQuery({ queryKey: ["maintenance"], queryFn: () => fn() });
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState("all");
  const filtered = data.filter(m => status === "all" || m.status === status);
  const writable = can.writeMaintenance(role);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Maintenance</h1>
          <p className="text-sm text-muted-foreground">Opening a record puts the vehicle In Shop. Closing it returns it to Available.</p>
        </div>
        {writable && <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" />Open maintenance</Button>}
      </div>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>
      <div className="rounded-md border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Opened</TableHead>
              <TableHead>Closed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>}
            {!isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No records</TableCell></TableRow>}
            {filtered.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.vehicle?.registration_number} — {m.vehicle?.model}</TableCell>
                <TableCell>{m.description}</TableCell>
                <TableCell>{money(m.cost)}</TableCell>
                <TableCell>{date(m.opened_at)}</TableCell>
                <TableCell>{m.closed_at ? date(m.closed_at) : "—"}</TableCell>
                <TableCell><MaintenanceStatusBadge status={m.status} /></TableCell>
                <TableCell className="text-right">
                  {writable && m.status === "active" && <CloseButton id={m.id} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {creating && <NewMaintenanceDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

function CloseButton({ id }: { id: string }) {
  const qc = useQueryClient();
  const close = useServerFn(closeMaintenance);
  const m = useMutation({ mutationFn: () => close({ data: { id } }), onSuccess: () => { toast.success("Closed"); qc.invalidateQueries(); }, onError: (e) => toast.error(prettyErr(e)) });
  return <Button size="sm" variant="ghost" onClick={() => m.mutate()} disabled={m.isPending}><CheckCircle className="h-4 w-4 mr-1 text-emerald-600" />Close</Button>;
}

function NewMaintenanceDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const open = useServerFn(openMaintenance);
  const vfn = useServerFn(getVehicles);
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: () => vfn() });
  const [form, setForm] = useState({ vehicle_id: "", description: "", cost: "0" });
  const m = useMutation({
    mutationFn: () => open({ data: { vehicle_id: form.vehicle_id, description: form.description.trim(), cost: Number(form.cost) } }),
    onSuccess: () => { toast.success("Maintenance opened; vehicle set to In Shop"); qc.invalidateQueries(); onClose(); },
    onError: (e) => toast.error(prettyErr(e)),
  });
  const available = vehicles.filter(v => v.status !== "retired" && v.status !== "on_trip");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Open maintenance</DialogTitle><DialogDescription>Retired vehicles or those currently on a trip cannot be sent to the shop.</DialogDescription></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-3">
          <div>
            <Label className="text-xs">Vehicle</Label>
            <Select value={form.vehicle_id} onValueChange={v => setForm({ ...form, vehicle_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose vehicle" /></SelectTrigger>
              <SelectContent>{available.map(v => <SelectItem key={v.id} value={v.id}>{v.registration_number} — {v.model}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Description</Label><Textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label className="text-xs">Estimated cost</Label><Input type="number" min={0} value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={m.isPending || !form.vehicle_id}>{m.isPending ? "Opening…" : "Open"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
