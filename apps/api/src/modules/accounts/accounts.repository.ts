import { accounts, type Account, type InsertAccount } from "@shared/schema";
import { db } from "../../db";
import { and, eq } from "drizzle-orm";

export class AccountsRepository {
  listByUser(userId: string): Promise<Account[]> {
    return db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.isArchived, false)));
  }

  async getById(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async create(data: InsertAccount): Promise<Account> {
    const [account] = await db.insert(accounts).values(data).returning();
    return account;
  }

  async update(
    id: number,
    userId: string,
    updates: Partial<InsertAccount>
  ): Promise<Account | undefined> {
    const [account] = await db
      .update(accounts)
      .set(updates)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .returning();
    return account;
  }

  async archive(id: number, userId: string): Promise<void> {
    await db
      .update(accounts)
      .set({ isArchived: true })
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
  }
}
