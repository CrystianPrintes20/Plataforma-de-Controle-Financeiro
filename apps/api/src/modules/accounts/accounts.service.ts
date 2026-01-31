import type { Account, InsertAccount } from "@shared/schema";
import { AccountsRepository } from "./accounts.repository";

export class AccountsService {
  constructor(private readonly repo = new AccountsRepository()) {}

  list(userId: string): Promise<Account[]> {
    return this.repo.listByUser(userId);
  }

  get(id: number): Promise<Account | undefined> {
    return this.repo.getById(id);
  }

  create(input: InsertAccount): Promise<Account> {
    return this.repo.create(input);
  }

  update(
    id: number,
    userId: string,
    input: Partial<InsertAccount>
  ): Promise<Account | undefined> {
    return this.repo.update(id, userId, input);
  }

  remove(id: number, userId: string): Promise<void> {
    return this.repo.archive(id, userId);
  }
}
