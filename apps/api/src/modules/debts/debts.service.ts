import type { Debt, InsertDebt } from "@shared/schema";
import { DebtsRepository } from "./debts.repository";

export class DebtsService {
  constructor(private readonly repo = new DebtsRepository()) {}

  list(userId: string): Promise<Debt[]> {
    return this.repo.listByUser(userId);
  }

  create(input: InsertDebt): Promise<Debt> {
    return this.repo.create(input);
  }

  update(
    id: number,
    userId: string,
    input: Partial<InsertDebt>
  ): Promise<Debt | undefined> {
    return this.repo.update(id, userId, input);
  }
}
