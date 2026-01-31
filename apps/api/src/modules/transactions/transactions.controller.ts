import type { Express } from "express";
import { z } from "zod";
import { api } from "@shared/routes";
import { isAuthenticated } from "../../auth/localAuth";
import { HTTP_STATUS } from "../../shared";
import { ok, fail } from "../../shared";
import { TransactionsService } from "./transactions.service";

export function registerTransactionRoutes(
  app: Express,
  service = new TransactionsService()
) {
  app.get(api.transactions.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const parsed = api.transactions.list.input?.parse(req.query) ?? {};
    const filters = {
      accountId: parsed.accountId,
      categoryId: parsed.categoryId,
      type: parsed.type,
      startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
      endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
      limit: parsed.limit,
    };

    const txs = await service.list(userId, filters);
    res.json(ok(txs));
  });

  app.post(api.transactions.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const input = api.transactions.create.input.parse({ ...req.body, userId });
      const tx = await service.create(input);
      res.status(HTTP_STATUS.CREATED).json(ok(tx));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(fail("Validation error", err.errors));
      }
      throw err;
    }
  });

  app.delete(api.transactions.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    await service.delete(Number(req.params.id), userId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });
}
