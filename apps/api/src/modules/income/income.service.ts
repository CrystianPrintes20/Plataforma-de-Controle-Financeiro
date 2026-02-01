import type { IncomeEntry, InsertIncomeEntry } from "@shared/schema";
import { IncomeRepository } from "./income.repository";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export class IncomeService {
  constructor(private readonly repo = new IncomeRepository()) {}

  listEntries(userId: string) {
    return this.repo.listEntriesByUser(userId);
  }

  async createEntry(userId: string, input: InsertIncomeEntry) {
    return this.repo.createEntry({ ...input, userId });
  }

  async updateEntry(
    userId: string,
    id: number,
    updates: Partial<InsertIncomeEntry>
  ): Promise<IncomeEntry | undefined> {
    const existing = await this.repo.getEntryById(id);
    if (!existing || existing.userId !== userId) return undefined;
    return this.repo.updateEntry(id, userId, updates);
  }

  async deleteEntry(userId: string, id: number): Promise<boolean> {
    const existing = await this.repo.getEntryById(id);
    if (!existing || existing.userId !== userId) return false;
    await this.repo.deleteEntry(id, userId);
    return true;
  }

  async annualSummary(userId: string, year: number) {
    const entries = await this.repo.listEntriesByUser(userId);

    const months = Array.from({ length: 12 }).map((_, idx) => {
      const monthDate = new Date(year, idx, 1);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const entriesTotal = entries.reduce((sum, item) => {
        const active = item.year === year && item.month === idx + 1;
        return active ? sum + Number(item.amount) : sum;
      }, 0);

      return {
        month: idx + 1,
        entriesTotal,
        total: entriesTotal,
      };
    });

    return { year, months };
  }
}
