import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getToken } from "@/lib/api";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: "/auth" });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
