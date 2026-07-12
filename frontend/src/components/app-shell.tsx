import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Truck, LayoutDashboard, Users, Route as RouteIcon, Wrench, Fuel, Receipt, BarChart3, LogOut, Menu, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { logout } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentUser, roleLabel, can, type AppRole } from "@/hooks/use-current-user";
import { Badge } from "@/components/ui/badge";
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
      <aside className="hidden lg:flex w-64 flex-col border-r bg-background">
        <div className="p-4 border-b flex items-center">
          <Logo className="h-7 w-auto text-foreground" />
        </div>
        <NavList items={items} onNavigate={() => {}} />
        <div className="p-3 border-t space-y-2">
          <div className="text-xs">
            <div className="truncate font-medium">{user?.email}</div>
            <Badge variant="secondary" className="mt-1">{roleLabel(role)}</Badge>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
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
              <NavList items={items} onNavigate={() => setOpen(false)} />
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

function NavList({ items, onNavigate }: { items: Item[]; onNavigate: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex-1 p-2 space-y-1">
      {items.map((n) => {
        const active = pathname === n.to || pathname.startsWith(n.to + "/");
        const Icon = n.icon;
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
              active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            )}
          >
            <Icon className="h-4 w-4" /> {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
