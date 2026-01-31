import type { Goal, InsertGoal } from "@shared/schema";
import { GoalsRepository } from "./goals.repository";

export class GoalsService {
  constructor(private readonly repo = new GoalsRepository()) {}

  list(userId: string): Promise<Goal[]> {
    return this.repo.listByUser(userId);
  }

  create(input: InsertGoal): Promise<Goal> {
    return this.repo.create(input);
  }

  update(
    id: number,
    userId: string,
    input: Partial<InsertGoal>
  ): Promise<Goal | undefined> {
    return this.repo.update(id, userId, input);
  }
}
