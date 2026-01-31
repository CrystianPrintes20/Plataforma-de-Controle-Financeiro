import { 
  users, accounts, categories, transactions, debts, investments, goals,
  type User, type InsertUser,
  type Account, type InsertAccount,
  type Category, type InsertCategory,
  type Transaction, type InsertTransaction,
  type Debt, type InsertDebt,
  type Investment, type InsertInvestment,
  type Goal, type InsertGoal
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, sum } from "drizzle-orm";

export interface IStorage {
  // Users (from Auth)
  getUser(id: string): Promise<User | undefined>;
  
  // Accounts
  getAccounts(userId: string): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, userId: string, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number, userId: string): Promise<void>;

  // Categories
  getCategories(userId: string): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Transactions
  getTransactions(userId: string, filters?: { 
    accountId?: number; 
    categoryId?: number; 
    type?: string; 
    startDate?: Date; 
    endDate?: Date;
    limit?: number;
  }): Promise<(Transaction & { category: Category | null, account: Account | null })[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  deleteTransaction(id: number, userId: string): Promise<void>;

  // Debts
  getDebts(userId: string): Promise<Debt[]>;
  createDebt(debt: InsertDebt): Promise<Debt>;
  updateDebt(id: number, userId: string, debt: Partial<InsertDebt>): Promise<Debt | undefined>;

  // Investments
  getInvestments(userId: string): Promise<Investment[]>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;

  // Goals
  getGoals(userId: string): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, userId: string, goal: Partial<InsertGoal>): Promise<Goal | undefined>;

  // Dashboard Stats
  getDashboardStats(userId: string): Promise<{
    totalBalance: number;
    netWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // --- Users ---
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // --- Accounts ---
  async getAccounts(userId: string): Promise<Account[]> {
    return db.select().from(accounts).where(and(eq(accounts.userId, userId), eq(accounts.isArchived, false)));
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const [account] = await db.insert(accounts).values(insertAccount).returning();
    return account;
  }

  async updateAccount(id: number, userId: string, updates: Partial<InsertAccount>): Promise<Account | undefined> {
    const [account] = await db
      .update(accounts)
      .set(updates)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .returning();
    return account;
  }

  async deleteAccount(id: number, userId: string): Promise<void> {
    await db.update(accounts).set({ isArchived: true }).where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
  }

  // --- Categories ---
  async getCategories(userId: string): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.userId, userId));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  // --- Transactions ---
  async getTransactions(userId: string, filters?: { 
    accountId?: number; 
    categoryId?: number; 
    type?: string; 
    startDate?: Date; 
    endDate?: Date;
    limit?: number;
  }): Promise<(Transaction & { category: Category | null, account: Account | null })[]> {
    let conditions = [eq(transactions.userId, userId)];

    if (filters?.accountId) conditions.push(eq(transactions.accountId, filters.accountId));
    if (filters?.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
    if (filters?.type) conditions.push(eq(transactions.type, filters.type));
    if (filters?.startDate) conditions.push(sql`${transactions.date} >= ${filters.startDate.toISOString()}`);
    if (filters?.endDate) conditions.push(sql`${transactions.date} <= ${filters.endDate.toISOString()}`);

    let query = db.select({
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
      account: accounts
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(and(...conditions))
    .orderBy(desc(transactions.date));

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    return query;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    
    // Update account balance
    const account = await this.getAccount(insertTransaction.accountId);
    if (account) {
      let newBalance = Number(account.balance);
      const amount = Number(insertTransaction.amount);
      
      if (insertTransaction.type === 'income') {
        newBalance += amount;
      } else if (insertTransaction.type === 'expense') {
        newBalance -= amount;
      }
      // Transfer logic would need both accounts, simplifying for now to just update source if it's a transfer out
      
      await this.updateAccount(insertTransaction.accountId, insertTransaction.userId, { balance: newBalance.toString() });
    }

    return transaction;
  }

  async deleteTransaction(id: number, userId: string): Promise<void> {
    await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  }

  // --- Debts ---
  async getDebts(userId: string): Promise<Debt[]> {
    return db.select().from(debts).where(eq(debts.userId, userId));
  }

  async createDebt(insertDebt: InsertDebt): Promise<Debt> {
    const [debt] = await db.insert(debts).values(insertDebt).returning();
    return debt;
  }

  async updateDebt(id: number, userId: string, updates: Partial<InsertDebt>): Promise<Debt | undefined> {
    const [debt] = await db
      .update(debts)
      .set(updates)
      .where(and(eq(debts.id, id), eq(debts.userId, userId)))
      .returning();
    return debt;
  }

  // --- Investments ---
  async getInvestments(userId: string): Promise<Investment[]> {
    return db.select().from(investments).where(eq(investments.userId, userId));
  }

  async createInvestment(insertInvestment: InsertInvestment): Promise<Investment> {
    const [investment] = await db.insert(investments).values(insertInvestment).returning();
    return investment;
  }

  // --- Goals ---
  async getGoals(userId: string): Promise<Goal[]> {
    return db.select().from(goals).where(eq(goals.userId, userId));
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const [goal] = await db.insert(goals).values(insertGoal).returning();
    return goal;
  }

  async updateGoal(id: number, userId: string, updates: Partial<InsertGoal>): Promise<Goal | undefined> {
    const [goal] = await db
      .update(goals)
      .set(updates)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();
    return goal;
  }

  // --- Stats ---
  async getDashboardStats(userId: string): Promise<{
    totalBalance: number;
    netWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
  }> {
    // 1. Total Balance (Sum of Accounts)
    const accountsList = await this.getAccounts(userId);
    const totalBalance = accountsList.reduce((sum, acc) => {
       // Credit cards have negative impact on net worth usually, but balance field usually means "how much money I have" 
       // or "how much I owe". 
       // Convention: Positive balance = Asset, Negative (or credit debt) = Liability.
       // For this simple app, let's assume 'balance' is signed correctly by user or logic. 
       // Typically Checking/Savings = +, Credit = - (if it represents debt).
       // Let's assume user enters positive for assets and we handle Credit Card debt as negative in Net Worth calc if needed.
       // Actually, for simplicity, let's just sum them up. If it's a credit card with 500 balance (owing), it should probably be stored as -500 or treated as debt.
       // Let's assume Credit Card 'balance' = debt amount (positive number).
       if (acc.type === 'credit') return sum - Number(acc.balance);
       return sum + Number(acc.balance);
    }, 0);

    // 2. Investments Value
    const investmentsList = await this.getInvestments(userId);
    const investmentsValue = investmentsList.reduce((sum, inv) => sum + Number(inv.currentValue), 0);

    // 3. Debts Value
    const debtsList = await this.getDebts(userId);
    const debtsValue = debtsList.reduce((sum, debt) => sum + Number(debt.remainingAmount), 0);

    const netWorth = totalBalance + investmentsValue - debtsValue;

    // 4. Monthly Income/Expenses
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const txs = await this.getTransactions(userId, { startDate: startOfMonth, endDate: endOfMonth });
    
    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    txs.forEach(tx => {
      const amt = Number(tx.amount);
      if (tx.type === 'income') monthlyIncome += amt;
      if (tx.type === 'expense') monthlyExpenses += amt;
    });

    return {
      totalBalance,
      netWorth,
      monthlyIncome,
      monthlyExpenses
    };
  }
}

export const storage = new DatabaseStorage();
