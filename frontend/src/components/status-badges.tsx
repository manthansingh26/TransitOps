/** Premium status pills with a leading dot for instant scannability. */

function Pill({ label, cls, dot }: { label: string; cls: string; dot: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

const GREEN = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
const BLUE = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
const AMBER = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
const GRAY = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700";
const RED = "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";

export function VehicleStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    available: { label: "Available", cls: GREEN, dot: "bg-emerald-500" },
    on_trip: { label: "On Trip", cls: BLUE, dot: "bg-blue-500" },
    in_shop: { label: "In Shop", cls: AMBER, dot: "bg-amber-500" },
    retired: { label: "Retired", cls: GRAY, dot: "bg-slate-400" },
  };
  const s = map[status] ?? { label: status, cls: GRAY, dot: "bg-slate-400" };
  return <Pill {...s} />;
}

export function DriverStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    available: { label: "Available", cls: GREEN, dot: "bg-emerald-500" },
    on_trip: { label: "On Trip", cls: BLUE, dot: "bg-blue-500" },
    off_duty: { label: "Off Duty", cls: GRAY, dot: "bg-slate-400" },
    suspended: { label: "Suspended", cls: RED, dot: "bg-red-500" },
  };
  const s = map[status] ?? { label: status, cls: GRAY, dot: "bg-slate-400" };
  return <Pill {...s} />;
}

export function TripStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    draft: { label: "Draft", cls: GRAY, dot: "bg-slate-400" },
    dispatched: { label: "Dispatched", cls: BLUE, dot: "bg-blue-500" },
    completed: { label: "Completed", cls: GREEN, dot: "bg-emerald-500" },
    cancelled: { label: "Cancelled", cls: RED, dot: "bg-red-500" },
  };
  const s = map[status] ?? { label: status, cls: GRAY, dot: "bg-slate-400" };
  return <Pill {...s} />;
}

export function MaintenanceStatusBadge({ status }: { status: string }) {
  return status === "active"
    ? <Pill label="Active" cls={AMBER} dot="bg-amber-500" />
    : <Pill label="Closed" cls={GRAY} dot="bg-slate-400" />;
}

export function LicenseBadge({ expiry }: { expiry: string }) {
  const days = Math.floor((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (days < 0) return <Pill label="Expired" cls={RED} dot="bg-red-500" />;
  if (days <= 30) return <Pill label={`Expires in ${days}d`} cls={AMBER} dot="bg-amber-500" />;
  return <Pill label="Valid" cls={GREEN} dot="bg-emerald-500" />;
}
