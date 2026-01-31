import { appSettings, type AppSettings } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export class SettingsRepository {
  async get(): Promise<AppSettings | undefined> {
    const [row] = await db.select().from(appSettings).limit(1);
    return row;
  }

  async upsert(currency: "BRL" | "USD"): Promise<AppSettings> {
    const existing = await this.get();
    if (existing) {
      const [updated] = await db
        .update(appSettings)
        .set({ currency, updatedAt: new Date() })
        .where(eq(appSettings.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(appSettings).values({ currency }).returning();
    return created;
  }
}
