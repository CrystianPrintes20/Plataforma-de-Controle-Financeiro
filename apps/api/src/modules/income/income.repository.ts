import { fixedIncomes, type FixedIncome, type InsertFixedIncome, transactions } from "@shared/schema";
import { db } from "../../db";
import { and, eq, gte, lte, or } from "drizzle-orm";

export class IncomeRepository {
  listFixedByUser(userId: string): Promise<FixedIncome[]> {
    return db
      .select()
      .from(fixedIncomes)
      .where(eq(fixedIncomes.userId, userId));
  }

  async getFixedById(id: number): Promise<FixedIncome | undefined> {
    const [row] = await db
      .select()
      .from(fixedIncomes)
      .where(eq(fixedIncomes.id, id));
    return row;
  }

  async createFixed(data: InsertFixedIncome): Promise<FixedIncome> {
    const [row] = await db.insert(fixedIncomes).values(data).returning();
    return row;
  }

  async updateFixed(
    id: number,
    userId: string,
    updates: Partial<InsertFixedIncome> & { endsAt?: Date | null; startsAt?: Date | null }
  ): Promise<FixedIncome | undefined> {
    const [row] = await db
      .update(fixedIncomes)
      .set(updates)
      .where(and(eq(fixedIncomes.id, id), eq(fixedIncomes.userId, userId)))
      .returning();
    return row;
  }

  async deleteFixed(id: number, userId: string): Promise<void> {
    await db
      .delete(fixedIncomes)
      .where(and(eq(fixedIncomes.id, id), eq(fixedIncomes.userId, userId)));
  }

  async listIncomeTransactionsByYear(userId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    return db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "income"),
          gte(transactions.date, start),
          lte(transactions.date, end)
        )
      );
  }
}
