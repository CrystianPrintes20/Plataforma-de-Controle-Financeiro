import type { IncomeEntry, InsertIncomeEntry } from "@shared/schema";
import { env } from "../../config/env";
import { AccountsRepository } from "../accounts/accounts.repository";
import { IncomeRepository } from "./income.repository";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export class IncomeService {
  constructor(
    private readonly repo = new IncomeRepository(),
    private readonly accountsRepo = new AccountsRepository()
  ) {}

  private shouldApplyToBalance(entry: Pick<IncomeEntry, "year" | "month">) {
    const { incomeBalanceFromYear, incomeBalanceFromMonth } = env;
    if (entry.year > incomeBalanceFromYear) return true;
    if (entry.year < incomeBalanceFromYear) return false;
    return entry.month >= incomeBalanceFromMonth;
  }

  listEntries(userId: string) {
    return this.repo.listEntriesByUser(userId);
  }

  async createEntry(userId: string, input: InsertIncomeEntry) {
    const created = await this.repo.createEntry({ ...input, userId });

    if (this.shouldApplyToBalance(created)) {
      const account = await this.accountsRepo.getById(created.accountId);
      if (account) {
        const newBalance = Number(account.balance) + Number(created.amount);
        await this.accountsRepo.update(created.accountId, userId, {
          balance: newBalance.toString(),
        });
      }
    }

    return created;
  }

  async updateEntry(
    userId: string,
    id: number,
    updates: Partial<InsertIncomeEntry>
  ): Promise<IncomeEntry | undefined> {
    const existing = await this.repo.getEntryById(id);
    if (!existing || existing.userId !== userId) return undefined;

    if (this.shouldApplyToBalance(existing)) {
      const account = await this.accountsRepo.getById(existing.accountId);
      if (account) {
        const balance = Number(account.balance) - Number(existing.amount);
        await this.accountsRepo.update(existing.accountId, userId, {
          balance: balance.toString(),
        });
      }
    }

    const updated = await this.repo.updateEntry(id, userId, updates);
    if (!updated) return undefined;

    if (this.shouldApplyToBalance(updated)) {
      const account = await this.accountsRepo.getById(updated.accountId);
      if (account) {
        const balance = Number(account.balance) + Number(updated.amount);
        await this.accountsRepo.update(updated.accountId, userId, {
          balance: balance.toString(),
        });
      }
    }

    return updated;
  }

  async deleteEntry(userId: string, id: number): Promise<boolean> {
    const existing = await this.repo.getEntryById(id);
    if (!existing || existing.userId !== userId) return false;

    if (this.shouldApplyToBalance(existing)) {
      const account = await this.accountsRepo.getById(existing.accountId);
      if (account) {
        const balance = Number(account.balance) - Number(existing.amount);
        await this.accountsRepo.update(existing.accountId, userId, {
          balance: balance.toString(),
        });
      }
    }

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
