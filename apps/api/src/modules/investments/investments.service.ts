import type {
  Investment,
  InsertInvestment,
  InsertInvestmentEntry,
  InsertTransaction,
} from "@shared/schema";
import { AccountsRepository } from "../accounts/accounts.repository";
import { TransactionsRepository } from "../transactions/transactions.repository";
import { InvestmentsRepository } from "./investments.repository";

export class InvestmentsService {
  constructor(
    private readonly repo = new InvestmentsRepository(),
    private readonly accountsRepo = new AccountsRepository(),
    private readonly transactionsRepo = new TransactionsRepository()
  ) {}

  list(userId: string): Promise<Investment[]> {
    return this.repo.listByUser(userId);
  }

  create(input: InsertInvestment): Promise<Investment> {
    return this.repo.create(input);
  }

  update(
    id: number,
    userId: string,
    input: Partial<InsertInvestment>
  ): Promise<Investment | undefined> {
    return this.repo.update(id, userId, input);
  }

  delete(id: number, userId: string): Promise<void> {
    return this.repo.delete(id, userId);
  }

  async createEntry(userId: string, input: InsertInvestmentEntry) {
    const investment = await this.repo.getById(input.investmentId);
    if (!investment || investment.userId !== userId) return undefined;

    const existing = await this.repo.getEntryByMonth(input.investmentId, input.year, input.month);
    const nextValue = existing
      ? Number(existing.value) + Number(input.value)
      : Number(input.value);

    const entry = existing
      ? await this.repo.updateEntry(existing.id, { value: nextValue.toString() })
      : await this.repo.createEntry({ ...input, userId });
    if (!entry) return undefined;
    const latest = await this.repo.getLatestEntryByInvestment(input.investmentId);

    if (latest && latest.year === entry.year && latest.month === entry.month) {
      await this.repo.update(input.investmentId, userId, {
        currentValue: String(entry.value),
        lastUpdated: new Date(),
      });
    }

    return entry;
  }

  listEntries(userId: string, year?: number) {
    return this.repo.listEntriesByUser(userId, year);
  }

  async updateEntry(userId: string, id: number, input: Partial<InsertInvestmentEntry>) {
    const existing = await this.repo.getEntryById(id);
    if (!existing || existing.userId !== userId) return undefined;

    const updated = await this.repo.updateEntry(id, input);
    if (!updated) return undefined;

    const latest = await this.repo.getLatestEntryByInvestment(updated.investmentId);
    if (latest) {
      await this.repo.update(updated.investmentId, userId, {
        currentValue: String(latest.value),
        lastUpdated: new Date(),
      });
    }

    return updated;
  }

  async applyInvestment(
    userId: string,
    payload: {
      investmentId: number;
      accountId: number;
      amount: string;
      date: Date;
      description?: string;
    }
  ) {
    const investment = await this.repo.getById(payload.investmentId);
    if (!investment || investment.userId !== userId) return undefined;

    const account = await this.accountsRepo.getById(payload.accountId);
    if (!account || account.userId !== userId) return undefined;

    const amount = Number(payload.amount);
    const newAccountBalance = Number(account.balance) - amount;
    const newInvestmentValue = Number(investment.currentValue) + amount;

    await this.accountsRepo.update(payload.accountId, userId, {
      balance: newAccountBalance.toString(),
    });

    const updatedInvestment = await this.repo.update(payload.investmentId, userId, {
      currentValue: newInvestmentValue.toString(),
    });

    const tx: InsertTransaction = {
      userId,
      accountId: payload.accountId,
      categoryId: null,
      amount: amount.toString(),
      date: payload.date,
      description: payload.description ?? `Aplicar investimento: ${investment.name}`,
      type: "transfer",
    };
    await this.transactionsRepo.create(tx);

    return updatedInvestment;
  }
}
