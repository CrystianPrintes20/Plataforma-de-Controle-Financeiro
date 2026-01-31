import type { Express } from "express";
import { api } from "@shared/routes";
import { isAuthenticated } from "../../auth/localAuth";
import { HTTP_STATUS, ok, fail } from "../../shared";
import { IncomeService } from "./income.service";
import { z } from "zod";

export function registerIncomeRoutes(app: Express, service = new IncomeService()) {
  app.get(api.income.fixed.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const rows = await service.listFixed(userId);
    res.json(ok(rows));
  });

  app.post(api.income.fixed.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const input = api.income.fixed.create.input.parse({ ...req.body, userId });
      const created = await service.createFixed(userId, input);
      res.status(HTTP_STATUS.CREATED).json(ok(created));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(fail("Validation error", err.errors));
      }
      throw err;
    }
  });

  app.put(api.income.fixed.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const input = api.income.fixed.update.input.parse(req.body);
      const updated = await service.updateFixedFutureOnly(
        userId,
        Number(req.params.id),
        input
      );
      if (!updated) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json(fail("Fixed income not found"));
      }
      res.json(ok(updated));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(fail("Validation error", err.errors));
      }
      throw err;
    }
  });

  app.delete(api.income.fixed.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const okDelete = await service.deleteFixedFutureOnly(userId, Number(req.params.id));
    if (!okDelete) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(fail("Fixed income not found"));
    }
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });

  app.get(api.income.annual.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const parsed =
      (api.income.annual.get.input?.parse(req.query) as { year?: number } | undefined) ??
      undefined;
    const year = parsed?.year ?? new Date().getFullYear();
    const payload = await service.annualSummary(userId, year);
    res.json(ok(payload));
  });
}
