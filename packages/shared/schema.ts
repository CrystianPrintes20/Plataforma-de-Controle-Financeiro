import { pgTable, text, serial, integer, boolean, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export Auth Models
export * from "./models/auth";
import { users } from "./models/auth";

// --- Accounts ---
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["checking", "savings", "credit", "cash", "investment"] }).notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  limit: numeric("limit", { precision: 12, scale: 2 }), // For credit cards
  color: text("color").default("#000000"),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true, createdAt: true });
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

// --- Categories ---
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  icon: text("icon"), // Lucide icon name
  color: text("color").default("#000000"),
  budget: numeric("budget", { precision: 12, scale: 2 }), // Monthly budget
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

// --- Transactions ---
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  categoryId: integer("category_id").references(() => categories.id), // Optional for transfers
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ["income", "expense", "transfer"] }).notNull(),
  isRecurring: boolean("is_recurring").default(false),
  recurringInterval: text("recurring_interval"), // e.g., "monthly", "weekly"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// --- Debts ---
export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  remainingAmount: numeric("remaining_amount", { precision: 12, scale: 2 }).notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  accountId: integer("account_id").references(() => accounts.id),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }), // Annual rate %
  dueDate: integer("due_date"), // Day of month
  minPayment: numeric("min_payment", { precision: 12, scale: 2 }),
  status: text("status", { enum: ["active", "paid", "defaulted"] }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDebtSchema = createInsertSchema(debts).omit({ id: true, createdAt: true });
export type Debt = typeof debts.$inferSelect;
export type InsertDebt = z.infer<typeof insertDebtSchema>;

// --- Investments ---
export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["stock", "crypto", "bond", "real_estate", "other"] }).notNull(),
  initialAmount: numeric("initial_amount", { precision: 12, scale: 2 }).notNull(),
  currentValue: numeric("current_value", { precision: 12, scale: 2 }).notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 4 }),
  ticker: text("ticker"), // e.g., AAPL
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({ id: true, createdAt: true, lastUpdated: true });
export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;

// --- Investment Entries ---
export const investmentEntries = pgTable("investment_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  investmentId: integer("investment_id").notNull().references(() => investments.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvestmentEntrySchema = createInsertSchema(investmentEntries).omit({
  id: true,
  createdAt: true,
});
export type InvestmentEntry = typeof investmentEntries.$inferSelect;
export type InsertInvestmentEntry = z.infer<typeof insertInvestmentEntrySchema>;

// --- Goals ---
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 12, scale: 2 }).default("0"),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true });
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

// --- Fixed Incomes ---
export const incomeEntries = pgTable("income_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  categoryId: integer("category_id").references(() => categories.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIncomeEntrySchema = createInsertSchema(incomeEntries).omit({
  id: true,
  createdAt: true,
});
export type IncomeEntry = typeof incomeEntries.$inferSelect;
export type InsertIncomeEntry = z.infer<typeof insertIncomeEntrySchema>;

// --- App Settings ---
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  currency: text("currency", { enum: ["BRL", "USD"] })
    .notNull()
    .default("BRL"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({
  id: true,
  updatedAt: true,
});
export type AppSettings = typeof appSettings.$inferSelect;
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;

// --- Relations ---

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
}));

export const debtsRelations = relations(debts, ({ one }) => ({
  user: one(users, { fields: [debts.userId], references: [users.id] }),
  account: one(accounts, { fields: [debts.accountId], references: [accounts.id] }),
}));

export const investmentsRelations = relations(investments, ({ one }) => ({
  user: one(users, { fields: [investments.userId], references: [users.id] }),
}));

export const investmentEntriesRelations = relations(investmentEntries, ({ one }) => ({
  user: one(users, { fields: [investmentEntries.userId], references: [users.id] }),
  investment: one(investments, { fields: [investmentEntries.investmentId], references: [investments.id] }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
}));
