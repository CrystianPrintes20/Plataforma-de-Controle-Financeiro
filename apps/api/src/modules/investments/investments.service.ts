import type { Investment, InsertInvestment, InsertTransaction } from "@shared/schema";
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
