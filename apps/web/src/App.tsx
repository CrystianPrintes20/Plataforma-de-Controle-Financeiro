import { Switch, Route } from "wouter";
import { queryClient } from "@/shared/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/shared/ui/toaster";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { useAuth } from "@/features/auth";
import { Loader2 } from "lucide-react";

import { DashboardPage } from "@/features/dashboard";
import { InvestmentsPage } from "@/features/investments";
import { TransactionsPage } from "@/features/transactions";
import { AccountsPage } from "@/features/accounts";
import { SettingsPage } from "@/features/settings";
import { IncomePage } from "@/features/income";
import { DebtsPage } from "@/features/debts";
import { AuthPage } from "@/features/auth";
import NotFoundPage from "@/app/NotFoundPage";

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
      <Route path="/" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/transactions" component={() => <ProtectedRoute component={TransactionsPage} />} />
      <Route path="/accounts" component={() => <ProtectedRoute component={AccountsPage} />} />
      <Route path="/investments" component={() => <ProtectedRoute component={InvestmentsPage} />} />
      <Route path="/income" component={() => <ProtectedRoute component={IncomePage} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
      <Route path="/debts" component={() => <ProtectedRoute component={DebtsPage} />} />
      {/* Fallback for other routes not yet implemented but linked in nav */}
      <Route path="/goals" component={() => <ProtectedRoute component={() => <div className="p-8">Metas em breve</div>} />} />
      
      <Route component={NotFoundPage} />
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
