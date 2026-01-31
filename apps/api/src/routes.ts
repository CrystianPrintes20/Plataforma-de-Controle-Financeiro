import type { Express } from "express";
import type { Server } from "http";
import { setupAuth, registerAuthRoutes } from "./auth/localAuth";
import {
  registerAccountRoutes,
  registerCategoryRoutes,
  registerDebtRoutes,
  registerDashboardRoutes,
  registerGoalRoutes,
  registerInvestmentRoutes,
  registerSettingsRoutes,
  registerTransactionRoutes,
} from "./modules";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  setupAuth(app);
  registerAuthRoutes(app);
  registerAccountRoutes(app);
  registerCategoryRoutes(app);
  registerTransactionRoutes(app);
  registerDebtRoutes(app);
  registerInvestmentRoutes(app);
  registerGoalRoutes(app);
  registerDashboardRoutes(app);
  registerSettingsRoutes(app);

  return httpServer;
}
