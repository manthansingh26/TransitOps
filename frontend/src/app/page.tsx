import Link from "next/link";
import {
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
} from "lucide-react";

const features = [
  { icon: Truck, title: "Vehicle Registry", desc: "Track every asset, capacity, and lifecycle status." },
  { icon: Users, title: "Driver Management", desc: "Monitor licenses, compliance, and safety scores." },
  { icon: Route, title: "Trip Dispatch", desc: "Assign vehicles and drivers with live validation." },
  { icon: Wrench, title: "Maintenance", desc: "Log repairs and auto-sync vehicle availability." },
  { icon: Fuel, title: "Fuel & Expenses", desc: "Capture operational costs per vehicle." },
  { icon: BarChart3, title: "Reports & Analytics", desc: "Utilization, efficiency, and ROI insights." },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center gap-6 px-6 py-24 text-center bg-gradient-to-b from-slate-50 to-white dark:from-zinc-950 dark:to-black">
        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Smart Transport Operations Platform
        </span>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 dark:text-zinc-50 sm:text-5xl">
          TransitOps
        </h1>
        <p className="max-w-xl text-lg leading-8 text-slate-600 dark:text-zinc-400">
          Replace spreadsheets and logbooks. Manage vehicles, drivers,
          dispatch, maintenance, and expenses in one place, with the business
          rules enforced automatically.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="flex h-12 items-center justify-center rounded-full bg-slate-900 px-6 font-medium text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="flex h-12 items-center justify-center rounded-full border border-slate-300 px-6 font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            View dashboard
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
          >
            <Icon className="h-8 w-8 text-amber-500" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-zinc-50">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
              {desc}
            </p>
          </div>
        ))}
      </section>

      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-zinc-800 dark:text-zinc-500">
        TransitOps — Odoo Hackathon 2026
      </footer>
    </main>
  );
}
