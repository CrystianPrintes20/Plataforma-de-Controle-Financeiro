import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  color?: "primary" | "secondary" | "accent" | "destructive";
}

export function KPICard({ title, value, trend, trendUp, icon: Icon, color = "primary" }: KPICardProps) {
  const colorMap = {
    primary: "text-emerald-500 bg-emerald-500/10",
    secondary: "text-blue-500 bg-blue-500/10",
    accent: "text-violet-500 bg-violet-500/10",
    destructive: "text-red-500 bg-red-500/10",
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold font-display">{value}</h3>
              {trend && (
                <span className={cn(
                  "text-xs font-medium px-1.5 py-0.5 rounded-full",
                  trendUp ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                )}>
                  {trend}
                </span>
              )}
            </div>
          </div>
          <div className={cn("p-3 rounded-xl", colorMap[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
