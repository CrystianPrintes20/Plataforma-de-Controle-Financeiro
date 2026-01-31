import { useState, type FormEvent } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { CheckCircle2, ShieldCheck, Loader2, Lock } from "lucide-react";

export default function AuthPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Login falhou",
        description: "Verifique seu e-mail e senha.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
             <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-emerald-500/20">
              F
            </div>
            <h1 className="text-2xl font-bold font-display tracking-tight">Finance OS</h1>
          </div>
          
          <div className="space-y-8 max-w-lg">
            <h2 className="text-5xl font-display font-bold leading-tight">
              Master your money with clarity and confidence.
            </h2>
            <p className="text-lg text-slate-300">
              The all-in-one platform to track expenses, monitor investments, and crush your financial goals.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <span className="text-slate-200">Real-time net worth tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <span className="text-slate-200">Unified investment dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <span className="text-slate-200">Smart goal setting & tracking</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-400">
          © 2024 Finance OS. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2 lg:hidden">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center font-bold text-2xl text-white">
                F
              </div>
            </div>
            <h1 className="text-3xl font-display font-bold">Finance OS</h1>
            <p className="text-muted-foreground">Welcome back.</p>
          </div>

          <Card className="border-border shadow-xl">
            <CardHeader className="text-center space-y-1">
              <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
              <CardDescription>
                Access your dashboard securely
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@exemplo.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/20"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Entrar
                    </>
                  )}
                </Button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Secure Access
                  </span>
                </div>
              </div>

              <div className="flex justify-center gap-8 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <ShieldCheck className="h-8 w-8 text-emerald-500/50" />
                  <span className="text-xs">Bank-grade Security</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
