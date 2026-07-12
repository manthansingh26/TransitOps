import { Badge } from "@/components/ui/badge";

export function VehicleStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    available: { label: "Available", cls: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200" },
    on_trip: { label: "On Trip", cls: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200" },
    in_shop: { label: "In Shop", cls: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200" },
    retired: { label: "Retired", cls: "bg-gray-100 text-gray-700 border-gray-200" },
  };
  const s = map[status] ?? { label: status, cls: "" };
  return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
}

export function DriverStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    available: { label: "Available", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    on_trip: { label: "On Trip", cls: "bg-blue-100 text-blue-800 border-blue-200" },
    off_duty: { label: "Off Duty", cls: "bg-gray-100 text-gray-700 border-gray-200" },
    suspended: { label: "Suspended", cls: "bg-red-100 text-red-800 border-red-200" },
  };
  const s = map[status] ?? { label: status, cls: "" };
  return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
}

export function TripStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "bg-gray-100 text-gray-700 border-gray-200" },
    dispatched: { label: "Dispatched", cls: "bg-blue-100 text-blue-800 border-blue-200" },
    completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-800 border-red-200" },
  };
  const s = map[status] ?? { label: status, cls: "" };
  return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
}

export function MaintenanceStatusBadge({ status }: { status: string }) {
  return status === "active"
    ? <Badge className="bg-amber-100 text-amber-800 border-amber-200" variant="outline">Active</Badge>
    : <Badge className="bg-gray-100 text-gray-700 border-gray-200" variant="outline">Closed</Badge>;
}

export function LicenseBadge({ expiry }: { expiry: string }) {
  const now = new Date();
  const e = new Date(expiry);
  const days = Math.floor((e.getTime() - now.getTime()) / 86400000);
  if (days < 0) return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Expired</Badge>;
  if (days <= 30) return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Expires in {days}d</Badge>;
  return <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">Valid</Badge>;
}
