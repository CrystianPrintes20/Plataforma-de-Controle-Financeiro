import {
  accounts,
  categories,
  transactions,
  type Account,
  type Category,
  type Transaction,
  type InsertTransaction,
} from "@shared/schema";
import { db } from "../../db";
import { and, desc, eq, sql } from "drizzle-orm";

export interface TransactionFilters {
  accountId?: number;
  categoryId?: number;
  type?: Transaction["type"];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export type TransactionWithRelations = Transaction & {
  category: Category | null;
  account: Account | null;
};

export class TransactionsRepository {
  async listByUser(
    userId: string,
    filters?: TransactionFilters
  ): Promise<TransactionWithRelations[]> {
    const conditions = [eq(transactions.userId, userId)];

    if (filters?.accountId) {
      conditions.push(eq(transactions.accountId, filters.accountId));
    }
    if (filters?.categoryId) {
      conditions.push(eq(transactions.categoryId, filters.categoryId));
    }
    if (filters?.type) {
      conditions.push(eq(transactions.type, filters.type));
    }
    if (filters?.startDate) {
      conditions.push(sql`${transactions.date} >= ${filters.startDate.toISOString()}`);
    }
    if (filters?.endDate) {
      conditions.push(sql`${transactions.date} <= ${filters.endDate.toISOString()}`);
    }

    const query = db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        accountId: transactions.accountId,
        categoryId: transactions.categoryId,
        amount: transactions.amount,
        date: transactions.date,
        description: transactions.description,
        type: transactions.type,
        isRecurring: transactions.isRecurring,
        recurringInterval: transactions.recurringInterval,
        createdAt: transactions.createdAt,
        category: categories,
        account: accounts,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.date));

    if (filters?.limit) {
      return query.limit(filters.limit);
    }

    return query;
  }

  async create(input: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(input)
      .returning();
    return transaction;
  }

  async delete(id: number, userId: string): Promise<void> {
    await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  }
}
