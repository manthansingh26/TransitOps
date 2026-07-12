import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getExpenses, createExpense } from "@/lib/finance.functions";
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
import { Textarea } from "@/components/ui/textarea";
import { date, money } from "@/lib/format";
import { prettyErr } from "./vehicles";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/expenses")({
  component: ExpensesPage,
});

function ExpensesPage() {
  const { role } = useCurrentUser();
  const fn = useServerFn(getExpenses);
  const { data = [], isLoading } = useQuery({ queryKey: ["expenses"], queryFn: () => fn() });
  const [creating, setCreating] = useState(false);
  const writable = can.writeFinance(role);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <p className="text-sm text-muted-foreground">Tolls, fines, insurance, and other operational costs</p>
        </div>
        {writable && <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" />New expense</Button>}
      </div>
      <div className="rounded-md border bg-background overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Vehicle</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Description</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>}
            {!isLoading && data.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No expenses</TableCell></TableRow>}
            {data.map(x => (
              <TableRow key={x.id}>
                <TableCell>{date(x.date)}</TableCell>
                <TableCell>{x.vehicle?.registration_number ?? <span className="text-muted-foreground">General</span>}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{x.category}</Badge></TableCell>
                <TableCell>{money(x.amount)}</TableCell>
                <TableCell className="max-w-md truncate">{x.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {creating && <NewExpenseDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

function NewExpenseDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const create = useServerFn(createExpense);
  const vfn = useServerFn(getVehicles);
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: () => vfn() });
  const [form, setForm] = useState({ vehicle_id: "none", category: "toll", amount: "", date: new Date().toISOString().slice(0, 10), description: "" });
  const m = useMutation({
    mutationFn: () => create({ data: {
      vehicle_id: form.vehicle_id === "none" ? null : form.vehicle_id,
      category: form.category as "toll" | "fine" | "insurance" | "other",
      amount: Number(form.amount), date: form.date, description: form.description.trim(),
    } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries(); onClose(); },
    onError: (e) => toast.error(prettyErr(e)),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New expense</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">Vehicle (optional)</Label>
            <Select value={form.vehicle_id} onValueChange={v => setForm({ ...form, vehicle_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General (no vehicle)</SelectItem>
                {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.registration_number}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="toll">Toll</SelectItem>
                <SelectItem value="fine">Fine</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Amount</Label><Input type="number" min={0} step="0.01" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
          <div className="col-span-2"><Label className="text-xs">Date</Label><Input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          <div className="col-span-2"><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={m.isPending}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
