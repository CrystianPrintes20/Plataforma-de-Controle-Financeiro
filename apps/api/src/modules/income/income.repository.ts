import { incomeEntries, type IncomeEntry, type InsertIncomeEntry, transactions } from "@shared/schema";
import { db } from "../../db";
import { and, eq, gte, lte, or } from "drizzle-orm";

export class IncomeRepository {
  listEntriesByUser(userId: string): Promise<IncomeEntry[]> {
    return db
      .select()
      .from(incomeEntries)
      .where(eq(incomeEntries.userId, userId));
  }

  async getEntryById(id: number): Promise<IncomeEntry | undefined> {
    const [row] = await db
      .select()
      .from(incomeEntries)
      .where(eq(incomeEntries.id, id));
    return row;
  }

  async createEntry(data: InsertIncomeEntry): Promise<IncomeEntry> {
    const [row] = await db.insert(incomeEntries).values(data).returning();
    return row;
  }

  async updateEntry(
    id: number,
    userId: string,
    updates: Partial<InsertIncomeEntry> & { endsAt?: Date | null; startsAt?: Date | null }
  ): Promise<IncomeEntry | undefined> {
    const [row] = await db
      .update(incomeEntries)
      .set(updates)
      .where(and(eq(incomeEntries.id, id), eq(incomeEntries.userId, userId)))
      .returning();
    return row;
  }

  async deleteEntry(id: number, userId: string): Promise<void> {
    await db
      .delete(incomeEntries)
      .where(and(eq(incomeEntries.id, id), eq(incomeEntries.userId, userId)));
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
