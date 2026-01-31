import { categories, type Category, type InsertCategory } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export class CategoriesRepository {
  listByUser(userId: string): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.userId, userId));
  }

  async create(data: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(data).returning();
    return category;
  }
}
