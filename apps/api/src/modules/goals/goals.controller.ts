import type { Express } from "express";
import { api } from "@shared/routes";
import { isAuthenticated } from "../../auth/localAuth";
import { HTTP_STATUS } from "../../shared";
import { ok, fail } from "../../shared";
import { GoalsService } from "./goals.service";

export function registerGoalRoutes(
  app: Express,
  service = new GoalsService()
) {
  app.get(api.goals.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const goals = await service.list(userId);
    res.json(ok(goals));
  });

  app.post(api.goals.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const input = api.goals.create.input.parse({ ...req.body, userId });
    const goal = await service.create(input);
    res.status(HTTP_STATUS.CREATED).json(ok(goal));
  });

  app.put(api.goals.update.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const input = api.goals.update.input.parse(req.body);
    const goal = await service.update(Number(req.params.id), userId, input);
    if (!goal) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(fail("Goal not found"));
    }
    res.json(ok(goal));
  });
}
