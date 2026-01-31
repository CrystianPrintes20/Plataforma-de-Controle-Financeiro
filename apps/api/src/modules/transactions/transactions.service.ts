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

  delete(id: number, userId: string): Promise<void> {
    return this.transactionsRepo.delete(id, userId);
  }
}
