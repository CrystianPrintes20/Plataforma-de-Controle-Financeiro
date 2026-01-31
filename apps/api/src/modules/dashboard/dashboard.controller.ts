import type { Express } from "express";
import { api } from "@shared/routes";
import { isAuthenticated } from "../../auth/localAuth";
import { ok } from "../../shared";
import { DashboardService } from "./dashboard.service";

export function registerDashboardRoutes(
  app: Express,
  service = new DashboardService()
) {
  app.get(api.dashboard.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const payload = await service.getDashboard(userId);
    res.json(ok(payload));
  });
}
