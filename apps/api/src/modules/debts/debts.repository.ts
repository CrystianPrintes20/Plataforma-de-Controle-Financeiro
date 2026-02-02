import { debts, type Debt, type InsertDebt } from "@shared/schema";
import { db } from "../../db";
import { and, eq } from "drizzle-orm";

export class DebtsRepository {
  listByUser(userId: string): Promise<Debt[]> {
    return db.select().from(debts).where(eq(debts.userId, userId));
  }

  async getById(id: number): Promise<Debt | undefined> {
    const [debt] = await db.select().from(debts).where(eq(debts.id, id));
    return debt;
  }

  async create(data: InsertDebt): Promise<Debt> {
    const [debt] = await db.insert(debts).values(data).returning();
    return debt;
  }

  async update(
    id: number,
    userId: string,
    updates: Partial<InsertDebt>
  ): Promise<Debt | undefined> {
    const [debt] = await db
      .update(debts)
      .set(updates)
      .where(and(eq(debts.id, id), eq(debts.userId, userId)))
      .returning();
    return debt;
  }

  async delete(id: number, userId: string): Promise<void> {
    await db.delete(debts).where(and(eq(debts.id, id), eq(debts.userId, userId)));
  }
}
