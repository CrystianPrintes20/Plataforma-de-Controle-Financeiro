import type { Express } from "express";
import { z } from "zod";
import { api } from "@shared/routes";
import { isAuthenticated } from "../../auth/localAuth";
import { HTTP_STATUS } from "../../shared";
import { ok, fail } from "../../shared";
import { CategoriesService } from "./categories.service";

export function registerCategoryRoutes(
  app: Express,
  service = new CategoriesService()
) {
  app.get(api.categories.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const categories = await service.list(userId);
    res.json(ok(categories));
  });

  app.post(api.categories.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const input = api.categories.create.input.parse({ ...req.body, userId });
      const category = await service.create(input);
      res.status(HTTP_STATUS.CREATED).json(ok(category));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json(fail("Validation error", err.errors));
      }
      throw err;
    }
  });
}
