import type { Express } from "express";
import { api } from "@shared/routes";
import { ok } from "../../shared/http";
import { SettingsService } from "./settings.service";
import { z } from "zod";

const bodySchema = z.object({
  currency: z.enum(["BRL", "USD"]),
});

export function registerSettingsRoutes(app: Express, service = new SettingsService()) {
  app.get(api.settings.currency.path, async (_req, res) => {
    const currency = await service.getCurrency();
    res.json(ok({ currency }));
  });

  app.put(api.settings.currency.path, async (req, res) => {
    const payload = bodySchema.parse(req.body);
    const updated = await service.setCurrency(payload.currency);
    res.json(ok({ currency: updated.currency }));
  });
}
