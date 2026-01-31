import type { FixedIncome, InsertFixedIncome } from "@shared/schema";
import { IncomeRepository } from "./income.repository";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function firstDayNextMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export class IncomeService {
  constructor(private readonly repo = new IncomeRepository()) {}

  listFixed(userId: string) {
    return this.repo.listFixedByUser(userId).then((rows) =>
      rows.filter((row) => !row.endsAt || row.endsAt >= new Date())
    );
  }

  async createFixed(userId: string, input: InsertFixedIncome) {
    return this.repo.createFixed({ ...input, userId });
  }

  async updateFixedFutureOnly(
    userId: string,
    id: number,
    updates: Partial<InsertFixedIncome>
  ): Promise<FixedIncome | undefined> {
    const existing = await this.repo.getFixedById(id);
    if (!existing || existing.userId !== userId) return undefined;

    const now = new Date();
    const endCurrentMonth = endOfMonth(now);
    await this.repo.updateFixed(id, userId, { endsAt: endCurrentMonth });

    const nextStart = firstDayNextMonth(now);
    const newRecord: InsertFixedIncome = {
      userId,
      name: updates.name ?? existing.name,
      amount: updates.amount ?? existing.amount,
      dayOfMonth: updates.dayOfMonth ?? existing.dayOfMonth,
      accountId: updates.accountId ?? existing.accountId,
      categoryId: updates.categoryId ?? existing.categoryId ?? undefined,
      startsAt: nextStart,
    } as InsertFixedIncome;

    return this.repo.createFixed(newRecord);
  }

  async deleteFixedFutureOnly(userId: string, id: number): Promise<boolean> {
    const existing = await this.repo.getFixedById(id);
    if (!existing || existing.userId !== userId) return false;
    await this.repo.updateFixed(id, userId, { endsAt: new Date() });
    return true;
  }

  async annualSummary(userId: string, year: number) {
    const fixed = await this.repo.listFixedByUser(userId);
    const variable = await this.repo.listIncomeTransactionsByYear(userId, year);

    const months = Array.from({ length: 12 }).map((_, idx) => {
      const monthDate = new Date(year, idx, 1);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const fixedTotal = fixed.reduce((sum, item) => {
        const startsAt = item.startsAt ?? item.createdAt ?? monthStart;
        const endsAt = item.endsAt ?? null;
        const active = startsAt <= monthEnd && (!endsAt || endsAt >= monthStart);
        return active ? sum + Number(item.amount) : sum;
      }, 0);

      const variableTotal = variable
        .filter((tx) => {
          const date = new Date(tx.date);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      return {
        month: idx + 1,
        fixedTotal,
        variableTotal,
        total: fixedTotal + variableTotal,
      };
    });

    return { year, months };
  }
}
