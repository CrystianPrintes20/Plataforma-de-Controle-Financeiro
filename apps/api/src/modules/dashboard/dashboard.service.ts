import { AccountsRepository } from "../accounts/accounts.repository";
import { CategoriesRepository } from "../categories/categories.repository";
import { DebtsRepository } from "../debts/debts.repository";
import { InvestmentsRepository } from "../investments/investments.repository";
import { TransactionsRepository } from "../transactions/transactions.repository";

export class DashboardService {
  constructor(
    private readonly accountsRepo = new AccountsRepository(),
    private readonly categoriesRepo = new CategoriesRepository(),
    private readonly transactionsRepo = new TransactionsRepository(),
    private readonly debtsRepo = new DebtsRepository(),
    private readonly investmentsRepo = new InvestmentsRepository()
  ) {}

  async seedIfNewUser(userId: string) {
    const existingAccounts = await this.accountsRepo.listByUser(userId);
    if (existingAccounts.length > 0) return;

    const checking = await this.accountsRepo.create({
      userId,
      name: "Main Checking",
      type: "checking",
      balance: "5000.00",
      color: "#10b981",
    });
    const credit = await this.accountsRepo.create({
      userId,
      name: "Credit Card",
      type: "credit",
      balance: "450.00",
      limit: "10000.00",
      color: "#3b82f6",
    });

    const salary = await this.categoriesRepo.create({
      userId,
      name: "Salary",
      type: "income",
      icon: "Briefcase",
    });
    const rent = await this.categoriesRepo.create({
      userId,
      name: "Rent",
      type: "expense",
      icon: "Home",
      budget: "1200.00",
    });
    const groceries = await this.categoriesRepo.create({
      userId,
      name: "Groceries",
      type: "expense",
      icon: "ShoppingCart",
      budget: "400.00",
    });

    const today = new Date();
    await this.transactionsRepo.create({
      userId,
      accountId: checking.id,
      categoryId: salary.id,
      amount: "3000.00",
      date: new Date(today.getFullYear(), today.getMonth(), 1),
      description: "Monthly Salary",
      type: "income",
    });
    await this.transactionsRepo.create({
      userId,
      accountId: checking.id,
      categoryId: rent.id,
      amount: "1200.00",
      date: new Date(today.getFullYear(), today.getMonth(), 5),
      description: "Rent Payment",
      type: "expense",
    });
    await this.transactionsRepo.create({
      userId,
      accountId: credit.id,
      categoryId: groceries.id,
      amount: "154.32",
      date: new Date(today.getFullYear(), today.getMonth(), 12),
      description: "Weekly Groceries",
      type: "expense",
    });
  }

  async getStats(userId: string) {
    const accountsList = await this.accountsRepo.listByUser(userId);
    const totalBalance = accountsList.reduce((sum, acc) => {
      if (acc.type === "credit") return sum - Number(acc.balance);
      return sum + Number(acc.balance);
    }, 0);

    const investmentsList = await this.investmentsRepo.listByUser(userId);
    const investmentsValue = investmentsList.reduce(
      (sum, inv) => sum + Number(inv.currentValue),
      0
    );

    const debtsList = await this.debtsRepo.listByUser(userId);
    const debtsValue = debtsList.reduce(
      (sum, debt) => sum + Number(debt.remainingAmount),
      0
    );

    const netWorth = totalBalance + investmentsValue - debtsValue;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const txs = await this.transactionsRepo.listByUser(userId, {
      startDate: startOfMonth,
      endDate: endOfMonth,
    });

    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    txs.forEach((tx) => {
      const amt = Number(tx.amount);
      if (tx.type === "income") monthlyIncome += amt;
      if (tx.type === "expense") monthlyExpenses += amt;
    });

    return {
      totalBalance,
      netWorth,
      monthlyIncome,
      monthlyExpenses,
    };
  }

  async getDashboard(userId: string) {
    await this.seedIfNewUser(userId);

    const stats = await this.getStats(userId);
    const recentTransactions = await this.transactionsRepo.listByUser(userId, {
      limit: 5,
    });

    const savingsRate =
      stats.monthlyIncome > 0
        ? ((stats.monthlyIncome - stats.monthlyExpenses) /
            stats.monthlyIncome) *
          100
        : 0;

    return {
      ...stats,
      savingsRate,
      recentTransactions,
    };
  }
}
