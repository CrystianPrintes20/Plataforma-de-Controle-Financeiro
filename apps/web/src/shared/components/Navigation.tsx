import { Link, useLocation } from "wouter";
import { LayoutDashboard, Receipt, CreditCard, PieChart, TrendingUp, Target, LogOut, Wallet, Settings } from "lucide-react";
import { useAuth } from "@/features/auth";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: Receipt },
    { href: "/accounts", label: "Accounts", icon: Wallet },
    { href: "/investments", label: "Investments", icon: TrendingUp },
    { href: "/debts", label: "Debts", icon: CreditCard },
    { href: "/goals", label: "Goals", icon: Target },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border md:hidden">
        <div className="flex justify-around items-center p-2">
          {navItems.slice(0, 5).map((item) => (
            <Link key={item.href} href={item.href} className={cn(
              "p-2 rounded-lg flex flex-col items-center gap-1 text-xs font-medium transition-colors",
              location === item.href 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 bg-card border-r border-border">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-primary-foreground font-bold text-xl">
              F
            </div>
            <h1 className="text-xl font-display font-bold text-foreground">Finance OS</h1>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group",
                location === item.href 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <item.icon className={cn("h-5 w-5", location === item.href ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <img 
              src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random`} 
              alt="Profile" 
              className="h-10 w-10 rounded-full border border-border"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => logout()}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
}
