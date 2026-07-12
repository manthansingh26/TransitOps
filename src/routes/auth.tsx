import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Truck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const DEMO_USERS = [
  { role: "Fleet Manager", email: "manager@transitops.demo" },
  { role: "Driver", email: "driver@transitops.demo" },
  { role: "Safety Officer", email: "safety@transitops.demo" },
  { role: "Financial Analyst", email: "finance@transitops.demo" },
];
const DEMO_PASSWORD = "Demo1234!";

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function signIn(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in");
    navigate({ to: "/dashboard", replace: true });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — signing you in");
    signIn();
  }

  async function seedDemo() {
    setSeeding(true);
    try {
      const res = await fetch("/api/public/seed-demo-users", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Seed failed");
      toast.success("Demo accounts ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  async function loginAs(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: demoEmail, password: DEMO_PASSWORD });
    if (error && error.message.toLowerCase().includes("invalid")) {
      toast.info("Seeding demo accounts...");
      await seedDemo();
      const retry = await supabase.auth.signInWithPassword({ email: demoEmail, password: DEMO_PASSWORD });
      setBusy(false);
      if (retry.error) return toast.error(retry.error.message);
    } else if (error) {
      setBusy(false);
      return toast.error(error.message);
    } else {
      setBusy(false);
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <Truck className="h-6 w-6" /> TransitOps
        </div>
        <div>
          <h1 className="text-4xl font-semibold leading-tight">Smart transport operations for modern logistics.</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-md">
            Dispatch, monitor, and analyze your fleet with rules that keep drivers safe and vehicles moving.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">© TransitOps</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to continue to TransitOps</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={signIn} className="space-y-3 mt-4">
                  <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                  <div><Label>Password</Label><Input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
                  <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={signUp} className="space-y-3 mt-4">
                  <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                  <div><Label>Password</Label><Input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} /></div>
                  <p className="text-xs text-muted-foreground">New signups default to the Driver role. A Fleet Manager can promote you later.</p>
                  <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 border-t pt-4">
              <p className="text-xs text-muted-foreground mb-2">Demo accounts (password: <code>{DEMO_PASSWORD}</code>)</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_USERS.map(u => (
                  <Button key={u.email} variant="outline" size="sm" disabled={busy || seeding}
                    onClick={() => loginAs(u.email)}>{u.role}</Button>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-2" disabled={seeding} onClick={seedDemo}>
                {seeding ? "Seeding…" : "Re-seed demo accounts"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
