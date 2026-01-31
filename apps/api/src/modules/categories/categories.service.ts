import type { Category, InsertCategory } from "@shared/schema";
import { CategoriesRepository } from "./categories.repository";

export class CategoriesService {
  constructor(private readonly repo = new CategoriesRepository()) {}

  list(userId: string): Promise<Category[]> {
    return this.repo.listByUser(userId);
  }

  create(input: InsertCategory): Promise<Category> {
    return this.repo.create(input);
  }
}
