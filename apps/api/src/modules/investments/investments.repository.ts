import {
  investments,
  type Investment,
  type InsertInvestment,
} from "@shared/schema";
import { db } from "../../db";
import { and, eq } from "drizzle-orm";

export class InvestmentsRepository {
  listByUser(userId: string): Promise<Investment[]> {
    return db.select().from(investments).where(eq(investments.userId, userId));
  }

  async create(data: InsertInvestment): Promise<Investment> {
    const [investment] = await db.insert(investments).values(data).returning();
    return investment;
  }

  async update(
    id: number,
    userId: string,
    updates: Partial<InsertInvestment>
  ): Promise<Investment | undefined> {
    const [investment] = await db
      .update(investments)
      .set(updates)
      .where(and(eq(investments.id, id), eq(investments.userId, userId)))
      .returning();
    return investment;
  }

  async delete(id: number, userId: string): Promise<void> {
    await db
      .delete(investments)
      .where(and(eq(investments.id, id), eq(investments.userId, userId)));
  }
}
