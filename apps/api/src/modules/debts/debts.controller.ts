import type { Express } from "express";
import { api } from "@shared/routes";
import { isAuthenticated } from "../../auth/localAuth";
import { HTTP_STATUS } from "../../shared";
import { ok, fail } from "../../shared";
import { DebtsService } from "./debts.service";

export function registerDebtRoutes(
  app: Express,
  service = new DebtsService()
) {
  app.get(api.debts.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const debts = await service.list(userId);
    res.json(ok(debts));
  });

  app.post(api.debts.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const input = api.debts.create.input.parse({ ...req.body, userId });
    const debt = await service.create(input);
    res.status(HTTP_STATUS.CREATED).json(ok(debt));
  });

  app.put(api.debts.update.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const input = api.debts.update.input.parse(req.body);
    const debt = await service.update(Number(req.params.id), userId, input);
    if (!debt) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(fail("Debt not found"));
    }
    res.json(ok(debt));
  });

  app.delete(api.debts.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const deleted = await service.delete(Number(req.params.id), userId);
    if (!deleted) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(fail("Debt not found"));
    }
    res.status(HTTP_STATUS.NO_CONTENT).end();
  });
}
