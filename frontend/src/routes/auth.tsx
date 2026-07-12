import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { login, signup, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Logo } from "@/components/logo";

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
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getToken()) navigate({ to: "/dashboard", replace: true });
  }, [navigate]);

  async function signIn(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Signed in");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await signup(fullName || email.split("@")[0], email, password);
      toast.success("Account created");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  async function loginAs(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setBusy(true);
    try {
      await login(demoEmail, DEMO_PASSWORD);
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#0b1120] via-[#111a30] to-[#0b1120] text-white overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
        <Logo className="relative h-9 w-auto text-white" />
        <div className="relative">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">Smart transport operations for modern logistics.</h1>
          <p className="mt-4 text-slate-300 max-w-md leading-relaxed">
            Dispatch, monitor, and analyze your fleet with rules that keep drivers safe and vehicles moving.
          </p>
          <div className="mt-8 flex gap-6 text-sm">
            <div><div className="text-2xl font-bold text-amber-400">10</div><div className="text-slate-400">Business rules</div></div>
            <div><div className="text-2xl font-bold text-amber-400">4</div><div className="text-slate-400">Roles</div></div>
            <div><div className="text-2xl font-bold text-amber-400">Live</div><div className="text-slate-400">Dispatch</div></div>
          </div>
        </div>
        <p className="relative text-sm text-slate-400">© TransitOps</p>
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
                  <div><Label>Full name</Label><Input required value={fullName} onChange={e => setFullName(e.target.value)} /></div>
                  <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                  <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
                  <p className="text-xs text-muted-foreground">New signups default to the Driver role. A Fleet Manager can promote you later.</p>
                  <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 border-t pt-4">
              <p className="text-xs text-muted-foreground mb-2">Demo accounts (password: <code>{DEMO_PASSWORD}</code>)</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_USERS.map(u => (
                  <Button key={u.email} variant="outline" size="sm" disabled={busy}
                    onClick={() => loginAs(u.email)}>{u.role}</Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
