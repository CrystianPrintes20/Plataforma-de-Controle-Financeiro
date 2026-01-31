import type { ReactNode } from "react";
import { Navigation } from "@/shared/components/Navigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      <main className="flex-1 md:ml-64 p-4 md:p-8">{children}</main>
    </div>
  );
}
