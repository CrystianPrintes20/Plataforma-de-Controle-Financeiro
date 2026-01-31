import {
  investments,
  type Investment,
  type InsertInvestment,
} from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export class InvestmentsRepository {
  listByUser(userId: string): Promise<Investment[]> {
    return db.select().from(investments).where(eq(investments.userId, userId));
  }

  async create(data: InsertInvestment): Promise<Investment> {
    const [investment] = await db.insert(investments).values(data).returning();
    return investment;
  }
}
