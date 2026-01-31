import { useDashboard } from "@/features/dashboard";
import { KPICard } from "@/shared/components/KPICard";
import { AddTransactionModal } from "@/features/transactions";
import { AppShell } from "@/app/AppShell";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/shared/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

export default function Dashboard() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  const chartData = data?.recentTransactions.slice(0, 7).map(t => ({
    name: format(new Date(t.date), 'MMM dd'),
    amount: Number(t.amount),
    type: t.type
  })).reverse() || [];

  return (
    <AppShell>
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, here's your financial overview.</p>
          </div>
          <AddTransactionModal />
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard 
            title="Total Balance" 
            value={`$${Number(data?.totalBalance || 0).toLocaleString()}`} 
            icon={Wallet} 
            color="primary"
          />
          <KPICard 
            title="Net Worth" 
            value={`$${Number(data?.netWorth || 0).toLocaleString()}`} 
            icon={PiggyBank} 
            color="secondary"
          />
          <KPICard 
            title="Monthly Income" 
            value={`$${Number(data?.monthlyIncome || 0).toLocaleString()}`} 
            icon={TrendingUp} 
            color="accent"
            trend="+2.5%"
            trendUp={true}
          />
          <KPICard 
            title="Monthly Expenses" 
            value={`$${Number(data?.monthlyExpenses || 0).toLocaleString()}`} 
            icon={TrendingDown} 
            color="destructive"
            trend="-1.2%"
            trendUp={true} // Good that expenses are down? Context matters but using Up color for "Good"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <Card className="lg:col-span-2 border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions List */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data?.recentTransactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                        t.type === 'income' ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                      )}>
                        {t.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(t.date), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "font-semibold text-sm",
                      t.type === 'income' ? "text-emerald-600" : "text-foreground"
                    )}>
                      {t.type === 'income' ? "+" : "-"}${Number(t.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
                {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
                  <p className="text-muted-foreground text-center py-8">No recent transactions</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
    </AppShell>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden md:block w-64 bg-card border-r border-border p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <main className="flex-1 p-8">
        <div className="flex justify-between mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-8">
          <Skeleton className="col-span-2 h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </main>
    </div>
  );
}
