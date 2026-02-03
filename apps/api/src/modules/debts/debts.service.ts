import type { Debt, InsertDebt } from "@shared/schema";
import { DebtsRepository } from "./debts.repository";
import { AccountsRepository } from "../accounts/accounts.repository";

export class DebtsService {
  constructor(
    private readonly repo = new DebtsRepository(),
    private readonly accountsRepo = new AccountsRepository()
  ) {}

  private shouldApplyToBalance(entry: Pick<Debt, "status" | "paymentMonth" | "accountId">) {
    return entry.status === "paid" && !!entry.accountId && entry.paymentMonth >= 2;
  }

  private normalizeInput(input: InsertDebt): InsertDebt {
    if (input.status === "paid") {
      return { ...input, remainingAmount: "0" };
    }
    return input;
  }

  private normalizeUpdate(input: Partial<InsertDebt>): Partial<InsertDebt> {
    if (input.status === "paid") {
      return { ...input, remainingAmount: "0" };
    }
    return input;
  }

  list(userId: string): Promise<Debt[]> {
    return this.repo.listByUser(userId);
  }

  async create(input: InsertDebt): Promise<Debt> {
    const created = await this.repo.create(this.normalizeInput(input));

    if (this.shouldApplyToBalance(created)) {
      const account = await this.accountsRepo.getById(created.accountId!);
      if (account) {
        const newBalance = Number(account.balance) - Number(created.totalAmount);
        await this.accountsRepo.update(created.accountId!, created.userId, {
          balance: newBalance.toString(),
        });
      }
    }

    return created;
  }

  update(
    id: number,
    userId: string,
    input: Partial<InsertDebt>
  ): Promise<Debt | undefined> {
    return this.updateInternal(id, userId, input);
  }

  private async updateInternal(
    id: number,
    userId: string,
    input: Partial<InsertDebt>
  ): Promise<Debt | undefined> {
    const existing = await this.repo.getById(id);
    if (!existing || existing.userId !== userId) return undefined;

    if (this.shouldApplyToBalance(existing)) {
      const account = await this.accountsRepo.getById(existing.accountId!);
      if (account) {
        const balance = Number(account.balance) + Number(existing.totalAmount);
        await this.accountsRepo.update(existing.accountId!, userId, {
          balance: balance.toString(),
        });
      }
    }

    const updated = await this.repo.update(id, userId, this.normalizeUpdate(input));
    if (!updated) return undefined;

    if (this.shouldApplyToBalance(updated)) {
      const account = await this.accountsRepo.getById(updated.accountId!);
      if (account) {
        const balance = Number(account.balance) - Number(updated.totalAmount);
        await this.accountsRepo.update(updated.accountId!, userId, {
          balance: balance.toString(),
        });
      }
    }

    return updated;
  }

  async delete(id: number, userId: string): Promise<boolean> {
    const existing = await this.repo.getById(id);
    if (!existing || existing.userId !== userId) return false;

    if (this.shouldApplyToBalance(existing)) {
      const account = await this.accountsRepo.getById(existing.accountId!);
      if (account) {
        const balance = Number(account.balance) + Number(existing.totalAmount);
        await this.accountsRepo.update(existing.accountId!, userId, {
          balance: balance.toString(),
        });
      }
    }

    await this.repo.delete(id, userId);
    return true;
  }
}
