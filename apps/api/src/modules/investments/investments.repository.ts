import {
  investments,
  type Investment,
  type InsertInvestment,
  investmentEntries,
  type InvestmentEntry,
  type InsertInvestmentEntry,
} from "@shared/schema";
import { db } from "../../db";
import { and, desc, eq } from "drizzle-orm";

export class InvestmentsRepository {
  listByUser(userId: string): Promise<Investment[]> {
    return db.select().from(investments).where(eq(investments.userId, userId));
  }

  async getById(id: number): Promise<Investment | undefined> {
    const [row] = await db.select().from(investments).where(eq(investments.id, id));
    return row;
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

  async createEntry(data: InsertInvestmentEntry): Promise<InvestmentEntry> {
    const [entry] = await db.insert(investmentEntries).values(data).returning();
    return entry;
  }

  async getEntryByMonth(
    investmentId: number,
    year: number,
    month: number
  ): Promise<InvestmentEntry | undefined> {
    const [entry] = await db
      .select()
      .from(investmentEntries)
      .where(
        and(
          eq(investmentEntries.investmentId, investmentId),
          eq(investmentEntries.year, year),
          eq(investmentEntries.month, month)
        )
      );
    return entry;
  }

  async updateEntry(
    id: number,
    updates: Partial<InsertInvestmentEntry>
  ): Promise<InvestmentEntry | undefined> {
    const [entry] = await db
      .update(investmentEntries)
      .set(updates)
      .where(eq(investmentEntries.id, id))
      .returning();
    return entry;
  }

  async listEntriesByUser(userId: string, year?: number): Promise<InvestmentEntry[]> {
    if (typeof year === "number") {
      return db
        .select()
        .from(investmentEntries)
        .where(and(eq(investmentEntries.userId, userId), eq(investmentEntries.year, year)));
    }
    return db
      .select()
      .from(investmentEntries)
      .where(eq(investmentEntries.userId, userId));
  }

  async getLatestEntryByInvestment(investmentId: number): Promise<InvestmentEntry | undefined> {
    const [entry] = await db
      .select()
      .from(investmentEntries)
      .where(eq(investmentEntries.investmentId, investmentId))
      .orderBy(desc(investmentEntries.year), desc(investmentEntries.month))
      .limit(1);
    return entry;
  }

  async getEntryById(id: number): Promise<InvestmentEntry | undefined> {
    const [entry] = await db.select().from(investmentEntries).where(eq(investmentEntries.id, id));
    return entry;
  }
}
