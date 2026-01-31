import type { Express } from "express";
import { api } from "@shared/routes";
import { isAuthenticated } from "../../auth/localAuth";
import { HTTP_STATUS } from "../../shared";
import { ok } from "../../shared";
import { InvestmentsService } from "./investments.service";

export function registerInvestmentRoutes(
  app: Express,
  service = new InvestmentsService()
) {
  app.get(api.investments.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const investments = await service.list(userId);
    res.json(ok(investments));
  });

  app.post(api.investments.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const input = api.investments.create.input.parse({ ...req.body, userId });
    const investment = await service.create(input);
    res.status(HTTP_STATUS.CREATED).json(ok(investment));
  });
}
