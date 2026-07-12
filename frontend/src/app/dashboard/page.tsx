import Link from "next/link";

const kpis = [
  { label: "Active Vehicles", value: "—" },
  { label: "Available Vehicles", value: "—" },
  { label: "In Maintenance", value: "—" },
  { label: "Active Trips", value: "—" },
  { label: "Pending Trips", value: "—" },
  { label: "Drivers On Duty", value: "—" },
  { label: "Fleet Utilization", value: "—%" },
];

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Operational overview. Live data connects once the backend is running.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Home
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              {kpi.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-zinc-50">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
