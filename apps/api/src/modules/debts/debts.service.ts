import type { Debt, InsertDebt } from "@shared/schema";
import { DebtsRepository } from "./debts.repository";

export class DebtsService {
  constructor(private readonly repo = new DebtsRepository()) {}

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

  create(input: InsertDebt): Promise<Debt> {
    return this.repo.create(this.normalizeInput(input));
  }

  update(
    id: number,
    userId: string,
    input: Partial<InsertDebt>
  ): Promise<Debt | undefined> {
    return this.repo.update(id, userId, this.normalizeUpdate(input));
  }
}
