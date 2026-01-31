import type { InsertTransaction, Transaction } from "@shared/schema";
import { AccountsRepository } from "../accounts/accounts.repository";
import {
  TransactionsRepository,
  type TransactionFilters,
  type TransactionWithRelations,
} from "./transactions.repository";

export class TransactionsService {
  constructor(
    private readonly transactionsRepo = new TransactionsRepository(),
    private readonly accountsRepo = new AccountsRepository()
  ) {}

  list(
    userId: string,
    filters?: TransactionFilters
  ): Promise<TransactionWithRelations[]> {
    return this.transactionsRepo.listByUser(userId, filters);
  }

  async create(input: InsertTransaction): Promise<Transaction> {
    const transaction = await this.transactionsRepo.create(input);

    const account = await this.accountsRepo.getById(input.accountId);
    if (!account) return transaction;

    let newBalance = Number(account.balance);
    const amount = Number(input.amount);

    if (input.type === "income") {
      newBalance += amount;
    } else if (input.type === "expense") {
      newBalance -= amount;
    }

    await this.accountsRepo.update(input.accountId, input.userId, {
      balance: newBalance.toString(),
    });

    return transaction;
  }

  async update(
    id: number,
    userId: string,
    updates: Partial<InsertTransaction>
  ): Promise<Transaction | undefined> {
    const existing = await this.transactionsRepo.getById(id);
    if (!existing || existing.userId !== userId) return undefined;

    // revert old balance impact
    if (existing.type === "income" || existing.type === "expense") {
      const account = await this.accountsRepo.getById(existing.accountId);
      if (account) {
        let balance = Number(account.balance);
        const oldAmount = Number(existing.amount);
        if (existing.type === "income") balance -= oldAmount;
        if (existing.type === "expense") balance += oldAmount;
        await this.accountsRepo.update(existing.accountId, userId, {
          balance: balance.toString(),
        });
      }
    }

    const updated = await this.transactionsRepo.update(id, userId, updates);
    if (!updated) return undefined;

    // apply new balance impact
    if (updated.type === "income" || updated.type === "expense") {
      const account = await this.accountsRepo.getById(updated.accountId);
      if (account) {
        let balance = Number(account.balance);
        const newAmount = Number(updated.amount);
        if (updated.type === "income") balance += newAmount;
        if (updated.type === "expense") balance -= newAmount;
        await this.accountsRepo.update(updated.accountId, userId, {
          balance: balance.toString(),
        });
      }
    }

    return updated;
  }

  delete(id: number, userId: string): Promise<void> {
    return this.transactionsRepo.delete(id, userId);
  }
}
