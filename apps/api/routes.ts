import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth/localAuth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // --- Accounts ---
  app.get(api.accounts.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const accounts = await storage.getAccounts(userId);
    res.json(accounts);
  });

  app.get(api.accounts.get.path, isAuthenticated, async (req: any, res) => {
    const account = await storage.getAccount(Number(req.params.id));
    if (!account || account.userId !== req.user!.claims.sub) {
      return res.status(404).json({ message: "Account not found" });
    }
    res.json(account);
  });

  app.post(api.accounts.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const input = api.accounts.create.input.parse({ ...req.body, userId });
      const account = await storage.createAccount(input);
      res.status(201).json(account);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.accounts.update.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const input = api.accounts.update.input.parse(req.body);
    const account = await storage.updateAccount(Number(req.params.id), userId, input);
    if (!account) return res.status(404).json({ message: "Account not found" });
    res.json(account);
  });

  app.delete(api.accounts.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    await storage.deleteAccount(Number(req.params.id), userId);
    res.status(204).send();
  });

  // --- Categories ---
  app.get(api.categories.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const categories = await storage.getCategories(userId);
    res.json(categories);
  });

  app.post(api.categories.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const input = api.categories.create.input.parse({ ...req.body, userId });
      const category = await storage.createCategory(input);
      res.status(201).json(category);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // --- Transactions ---
  app.get(api.transactions.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const filters = {
      accountId: req.query.accountId ? Number(req.query.accountId) : undefined,
      categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
      type: req.query.type as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };
    const txs = await storage.getTransactions(userId, filters);
    res.json(txs);
  });

  app.post(api.transactions.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.claims.sub;
      const input = api.transactions.create.input.parse({ ...req.body, userId });
      const tx = await storage.createTransaction(input);
      res.status(201).json(tx);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.transactions.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    await storage.deleteTransaction(Number(req.params.id), userId);
    res.status(204).send();
  });

  // --- Debts ---
  app.get(api.debts.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const debts = await storage.getDebts(userId);
    res.json(debts);
  });

  app.post(api.debts.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const input = api.debts.create.input.parse({ ...req.body, userId });
    const debt = await storage.createDebt(input);
    res.status(201).json(debt);
  });

  app.put(api.debts.update.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const input = api.debts.update.input.parse(req.body);
    const debt = await storage.updateDebt(Number(req.params.id), userId, input);
    if (!debt) return res.status(404).json({ message: "Debt not found" });
    res.json(debt);
  });

  // --- Investments ---
  app.get(api.investments.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const investments = await storage.getInvestments(userId);
    res.json(investments);
  });

  app.post(api.investments.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const input = api.investments.create.input.parse({ ...req.body, userId });
    const investment = await storage.createInvestment(input);
    res.status(201).json(investment);
  });

  // --- Goals ---
  app.get(api.goals.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const goals = await storage.getGoals(userId);
    res.json(goals);
  });

  app.post(api.goals.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const input = api.goals.create.input.parse({ ...req.body, userId });
    const goal = await storage.createGoal(input);
    res.status(201).json(goal);
  });

  app.put(api.goals.update.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const input = api.goals.update.input.parse(req.body);
    const goal = await storage.updateGoal(Number(req.params.id), userId, input);
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.json(goal);
  });

  // --- Dashboard ---
  app.get(api.dashboard.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    
    // Seed data if new user has no accounts
    const existingAccounts = await storage.getAccounts(userId);
    if (existingAccounts.length === 0) {
      // Seed Accounts
      const checking = await storage.createAccount({
        userId,
        name: "Main Checking",
        type: "checking",
        balance: "5000.00",
        color: "#10b981"
      });
      const credit = await storage.createAccount({
        userId,
        name: "Credit Card",
        type: "credit",
        balance: "450.00",
        limit: "10000.00",
        color: "#3b82f6"
      });

      // Seed Categories
      const salary = await storage.createCategory({ userId, name: "Salary", type: "income", icon: "Briefcase" });
      const rent = await storage.createCategory({ userId, name: "Rent", type: "expense", icon: "Home", budget: "1200.00" });
      const groceries = await storage.createCategory({ userId, name: "Groceries", type: "expense", icon: "ShoppingCart", budget: "400.00" });
      const dining = await storage.createCategory({ userId, name: "Dining Out", type: "expense", icon: "Utensils", budget: "200.00" });

      // Seed Transactions
      const today = new Date();
      await storage.createTransaction({
        userId,
        accountId: checking.id,
        categoryId: salary.id,
        amount: "3000.00",
        date: new Date(today.getFullYear(), today.getMonth(), 1), // 1st of month
        description: "Monthly Salary",
        type: "income"
      });
      await storage.createTransaction({
        userId,
        accountId: checking.id,
        categoryId: rent.id,
        amount: "1200.00",
        date: new Date(today.getFullYear(), today.getMonth(), 5), // 5th of month
        description: "Rent Payment",
        type: "expense"
      });
      await storage.createTransaction({
        userId,
        accountId: credit.id,
        categoryId: groceries.id,
        amount: "154.32",
        date: new Date(today.getFullYear(), today.getMonth(), 12),
        description: "Weekly Groceries",
        type: "expense"
      });
    }

    const stats = await storage.getDashboardStats(userId);
    
    // Get recent transactions (last 5)
    const recentTransactions = await storage.getTransactions(userId, { limit: 5 });
    
    const savingsRate = stats.monthlyIncome > 0 
      ? ((stats.monthlyIncome - stats.monthlyExpenses) / stats.monthlyIncome) * 100 
      : 0;

    res.json({
      ...stats,
      savingsRate,
      recentTransactions
    });
  });

  return httpServer;
}
