import type { Express } from "express";
import { z } from "zod";
import { api } from "@shared/routes";
import { isAuthenticated } from "../../auth/localAuth";
import { HTTP_STATUS } from "../../shared";
import { ok, fail } from "../../shared";
import { AccountsService } from "./accounts.service";

export function registerAccountRoutes(
  app: Express,
  service = new AccountsService()
) {
  app.get(api.accounts.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const accounts = await service.list(userId);
    res.json(ok(accounts));
  });

  app.get(api.accounts.get.path, isAuthenticated, async (req: any, res) => {
    const account = await service.get(Number(req.params.id));
    if (!account || account.userId !== req.user!.claims.sub) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(fail("Account not found"));
    }
    res.json(ok(account));
  });

  app.post(api.accounts.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const input = api.accounts.create.input.parse({ ...req.body, userId });
      const account = await service.create(input);
      res.status(HTTP_STATUS.CREATED).json(ok(account));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(fail("Validation error", err.errors));
      }
      throw err;
    }
  });

  app.put(api.accounts.update.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const input = api.accounts.update.input.parse(req.body);
    const account = await service.update(Number(req.params.id), userId, input);
    if (!account) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(fail("Account not found"));
    }
    res.json(ok(account));
  });

  app.delete(api.accounts.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    await service.remove(Number(req.params.id), userId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });
}
