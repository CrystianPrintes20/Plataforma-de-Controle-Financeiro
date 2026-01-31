import type { Express } from "express";
import { api } from "@shared/routes";
import { isAuthenticated } from "../../auth/localAuth";
import { HTTP_STATUS, ok, fail } from "../../shared";
import { InvestmentsService } from "./investments.service";
import { z } from "zod";

const applySchema = z.object({
  investmentId: z.coerce.number(),
  accountId: z.coerce.number(),
  amount: z.coerce.number().positive(),
  date: z.coerce.date().optional(),
  description: z.string().optional(),
});

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
    try {
      const userId = req.user!.claims.sub;
      const input = api.investments.create.input.parse({ ...req.body, userId });
      const investment = await service.create(input);
      res.status(HTTP_STATUS.CREATED).json(ok(investment));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(fail("Validation error", err.errors));
      }
      throw err;
    }
  });

  app.post(api.investments.apply.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const input = applySchema.parse(req.body);
      const updated = await service.applyInvestment(userId, {
        investmentId: input.investmentId,
        accountId: input.accountId,
        amount: input.amount.toString(),
        date: input.date ?? new Date(),
        description: input.description,
      });
      if (!updated) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json(fail("Investment or account not found"));
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

  app.put(api.investments.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const input = api.investments.update.input.parse(req.body);
      const investment = await service.update(Number(req.params.id), userId, input);
      if (!investment) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json(fail("Investment not found"));
      }
      res.json(ok(investment));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(fail("Validation error", err.errors));
      }
      throw err;
    }
  });

  app.delete(api.investments.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    await service.delete(Number(req.params.id), userId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });
}
