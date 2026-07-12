import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getFuelLogs, createFuelLog } from "@/lib/finance.functions";
import { getVehicles } from "@/lib/vehicles.functions";
import { useCurrentUser, can } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { date, money, num } from "@/lib/format";
import { prettyErr } from "./vehicles";

export const Route = createFileRoute("/_authenticated/fuel")({
  component: FuelPage,
});

function FuelPage() {
  const { role } = useCurrentUser();
  const fn = useServerFn(getFuelLogs);
  const { data = [], isLoading } = useQuery({ queryKey: ["fuel"], queryFn: () => fn() });
  const [creating, setCreating] = useState(false);
  const writable = can.writeFinance(role);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Fuel logs</h1>
          <p className="text-sm text-muted-foreground">Every fill-up feeds operational cost and fuel efficiency</p>
        </div>
        {writable && <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" />Log fuel</Button>}
      </div>
      <div className="rounded-md border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Liters</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Odometer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>}
            {!isLoading && data.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No records</TableCell></TableRow>}
            {data.map(f => (
              <TableRow key={f.id}>
                <TableCell>{date(f.date)}</TableCell>
                <TableCell>{f.vehicle?.registration_number} — {f.vehicle?.model}</TableCell>
                <TableCell>{num(f.liters, 1)}</TableCell>
                <TableCell>{money(f.cost)}</TableCell>
                <TableCell>{f.odometer_at_fill ? num(f.odometer_at_fill) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {creating && <NewFuelDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

function NewFuelDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const create = useServerFn(createFuelLog);
  const vfn = useServerFn(getVehicles);
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: () => vfn() });
  const [form, setForm] = useState({ vehicle_id: "", liters: "", cost: "", date: new Date().toISOString().slice(0, 10), odometer_at_fill: "" });
  const m = useMutation({
    mutationFn: () => create({ data: {
      vehicle_id: form.vehicle_id, liters: Number(form.liters), cost: Number(form.cost),
      date: form.date, odometer_at_fill: form.odometer_at_fill ? Number(form.odometer_at_fill) : undefined,
    } }),
    onSuccess: () => { toast.success("Logged"); qc.invalidateQueries(); onClose(); },
    onError: (e) => toast.error(prettyErr(e)),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Log fuel</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">Vehicle</Label>
            <Select value={form.vehicle_id} onValueChange={v => setForm({ ...form, vehicle_id: v })}>
              <SelectTrigger><SelectValue placeholder="Vehicle" /></SelectTrigger>
              <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.registration_number} — {v.model}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Liters</Label><Input type="number" min={0.1} step="0.1" required value={form.liters} onChange={e => setForm({ ...form, liters: e.target.value })} /></div>
          <div><Label className="text-xs">Cost</Label><Input type="number" min={0} step="0.01" required value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} /></div>
          <div><Label className="text-xs">Date</Label><Input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          <div><Label className="text-xs">Odometer (opt.)</Label><Input type="number" min={0} value={form.odometer_at_fill} onChange={e => setForm({ ...form, odometer_at_fill: e.target.value })} /></div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={m.isPending || !form.vehicle_id}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
