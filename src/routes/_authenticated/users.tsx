import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAppUsers, setUserRole } from "@/lib/users.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCurrentUser, can, roleLabel } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

function UsersPage() {
  const { role } = useCurrentUser();
  const fn = useServerFn(listAppUsers);
  const set = useServerFn(setUserRole);
  const qc = useQueryClient();
  const { data = [], isLoading, error } = useQuery({ queryKey: ["users"], queryFn: () => fn(), enabled: can.manageUsers(role) });
  const m = useMutation({
    mutationFn: (args: { user_id: string; role: string }) => set({ data: { user_id: args.user_id, role: args.role as "fleet_manager" | "driver" | "safety_officer" | "financial_analyst" } }),
    onSuccess: () => { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["users"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  if (!can.manageUsers(role)) return <div className="text-muted-foreground">Only fleet managers can view this page.</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">Manage app roles</p>
      </div>
      {error && <div className="text-red-600 text-sm">{error instanceof Error ? error.message : String(error)}</div>}
      <div className="rounded-md border bg-background overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Name</TableHead><TableHead>Current role</TableHead><TableHead>Change to</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>}
            {data.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.full_name || "—"}</TableCell>
                <TableCell>{roleLabel(u.role as "fleet_manager" | "driver" | "safety_officer" | "financial_analyst" | null)}</TableCell>
                <TableCell>
                  <Select value={u.role ?? ""} onValueChange={(v) => m.mutate({ user_id: u.id, role: v })}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Choose role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fleet_manager">Fleet Manager</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="safety_officer">Safety Officer</SelectItem>
                      <SelectItem value="financial_analyst">Financial Analyst</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
