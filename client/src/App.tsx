import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Accounts from "@/pages/Accounts";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/api/login" component={() => { window.location.href = "/api/login"; return null; }} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/transactions" component={() => <ProtectedRoute component={Transactions} />} />
      <Route path="/accounts" component={() => <ProtectedRoute component={Accounts} />} />
      {/* Fallback for other routes not yet implemented but linked in nav */}
      <Route path="/investments" component={() => <ProtectedRoute component={() => <div className="p-8">Investments Coming Soon</div>} />} />
      <Route path="/debts" component={() => <ProtectedRoute component={() => <div className="p-8">Debts Coming Soon</div>} />} />
      <Route path="/goals" component={() => <ProtectedRoute component={() => <div className="p-8">Goals Coming Soon</div>} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
