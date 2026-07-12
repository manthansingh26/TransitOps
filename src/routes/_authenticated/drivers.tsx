import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDrivers, saveDriver, deleteDriver } from "@/lib/drivers.functions";
import { useCurrentUser, can } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DriverStatusBadge, LicenseBadge } from "@/components/status-badges";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { date } from "@/lib/format";
import { prettyErr } from "./vehicles";

export const Route = createFileRoute("/_authenticated/drivers")({
  component: DriversPage,
});

type Driver = Awaited<ReturnType<typeof getDrivers>>[number];

function DriversPage() {
  const { role } = useCurrentUser();
  const fn = useServerFn(getDrivers);
  const { data = [], isLoading } = useQuery({ queryKey: ["drivers"], queryFn: () => fn() });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Driver | null | undefined>(undefined);
  const writable = can.writeDrivers(role);

  const filtered = useMemo(() => data.filter(d =>
    (status === "all" || d.status === status) &&
    (search === "" || d.name.toLowerCase().includes(search.toLowerCase()) || d.license_number.toLowerCase().includes(search.toLowerCase()))
  ), [data, search, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Drivers</h1>
          <p className="text-sm text-muted-foreground">{data.length} in registry</p>
        </div>
        {writable && <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-1" />New driver</Button>}
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
            <SelectItem value="off_duty">Off Duty</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>License #</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>}
            {!isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No drivers</TableCell></TableRow>}
            {filtered.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>{d.license_number}</TableCell>
                <TableCell>{d.license_category}</TableCell>
                <TableCell>{date(d.license_expiry_date)}</TableCell>
                <TableCell><LicenseBadge expiry={d.license_expiry_date} /></TableCell>
                <TableCell>{d.contact_number}</TableCell>
                <TableCell>{d.safety_score}</TableCell>
                <TableCell><DriverStatusBadge status={d.status} /></TableCell>
                <TableCell className="text-right">
                  {writable && <Button size="sm" variant="ghost" onClick={() => setEditing(d)}><Pencil className="h-4 w-4" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {writable && editing !== undefined && <DriverDialog driver={editing} onClose={() => setEditing(undefined)} />}
    </div>
  );
}

function DriverDialog({ driver, onClose }: { driver: Driver | null; onClose: () => void }) {
  const qc = useQueryClient();
  const save = useServerFn(saveDriver);
  const del = useServerFn(deleteDriver);
  const [form, setForm] = useState({
    name: driver?.name ?? "",
    license_number: driver?.license_number ?? "",
    license_category: driver?.license_category ?? "",
    license_expiry_date: driver?.license_expiry_date ?? "",
    contact_number: driver?.contact_number ?? "",
    safety_score: driver?.safety_score?.toString() ?? "80",
    status: driver?.status ?? "available",
  });
  const saveM = useMutation({
    mutationFn: () => save({ data: {
      id: driver?.id,
      name: form.name.trim(),
      license_number: form.license_number.trim(),
      license_category: form.license_category.trim(),
      license_expiry_date: form.license_expiry_date,
      contact_number: form.contact_number.trim(),
      safety_score: Number(form.safety_score),
      status: form.status as "available" | "on_trip" | "off_duty" | "suspended",
    } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries(); onClose(); },
    onError: (e) => toast.error(prettyErr(e)),
  });
  const delM = useMutation({
    mutationFn: () => del({ data: { id: driver!.id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries(); onClose(); },
    onError: (e) => toast.error(prettyErr(e)),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{driver ? "Edit driver" : "New driver"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveM.mutate(); }} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label className="text-xs">Full name</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="text-xs">License #</Label><Input required value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} /></div>
          <div><Label className="text-xs">Category</Label><Input value={form.license_category} onChange={e => setForm({ ...form, license_category: e.target.value })} /></div>
          <div><Label className="text-xs">License expiry</Label><Input type="date" required value={form.license_expiry_date} onChange={e => setForm({ ...form, license_expiry_date: e.target.value })} /></div>
          <div><Label className="text-xs">Contact</Label><Input value={form.contact_number} onChange={e => setForm({ ...form, contact_number: e.target.value })} /></div>
          <div><Label className="text-xs">Safety score</Label><Input type="number" min={0} max={100} value={form.safety_score} onChange={e => setForm({ ...form, safety_score: e.target.value })} /></div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as typeof form.status })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="off_duty">Off Duty</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="col-span-2 mt-2">
            {driver && <Button type="button" variant="destructive" onClick={() => delM.mutate()} disabled={delM.isPending}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>}
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saveM.isPending}>{saveM.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
