import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Truck, LayoutDashboard, Users, Route as RouteIcon, Wrench, Fuel, Receipt, BarChart3, LogOut, Menu, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { logout } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentUser, roleLabel, can, type AppRole } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

type Item = { to: string; label: string; icon: typeof Truck; show: (r: AppRole | null) => boolean };

const NAV: Item[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: () => true },
  { to: "/vehicles", label: "Vehicles", icon: Truck, show: () => true },
  { to: "/drivers", label: "Drivers", icon: Users, show: () => true },
  { to: "/trips", label: "Trips", icon: RouteIcon, show: () => true },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, show: (r) => r === "fleet_manager" },
  { to: "/fuel", label: "Fuel", icon: Fuel, show: (r) => r === "fleet_manager" || r === "financial_analyst" },
  { to: "/expenses", label: "Expenses", icon: Receipt, show: (r) => r === "fleet_manager" || r === "financial_analyst" },
  { to: "/reports", label: "Reports", icon: BarChart3, show: () => true },
  { to: "/users", label: "Users", icon: ShieldCheck, show: (r) => can.manageUsers(r) },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, role } = useCurrentUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    logout();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const items = NAV.filter((n) => n.show(role));

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#0b1120] text-slate-300">
        <div className="px-5 h-16 flex items-center border-b border-white/10">
          <Logo className="h-7 w-auto text-white" />
        </div>
        <NavList items={items} onNavigate={() => {}} />
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-sm font-semibold">
              {(user?.full_name ?? user?.email ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{user?.full_name ?? user?.email}</div>
              <div className="text-xs text-amber-400/90">{roleLabel(role)}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start text-slate-300 hover:bg-white/10 hover:text-white" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden border-b bg-background flex items-center justify-between px-4 py-2">
          <Logo className="h-6 w-auto text-foreground" />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button size="icon" variant="ghost"><Menu /></Button></SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="p-4 border-b flex items-center">
                <Logo className="h-6 w-auto text-foreground" />
              </div>
              <NavList items={items} onNavigate={() => setOpen(false)} dark={false} />
              <div className="p-3 border-t">
                <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}

function NavList({ items, onNavigate, dark = true }: { items: Item[]; onNavigate: () => void; dark?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex-1 p-3 space-y-1">
      {items.map((n) => {
        const active = pathname === n.to || pathname.startsWith(n.to + "/");
        const Icon = n.icon;
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              dark
                ? active
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
                : active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
            )}
          >
            {active && dark && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-amber-500" />}
            <Icon className={cn("h-4 w-4", active && dark && "text-amber-400")} /> {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
