import { goals, type Goal, type InsertGoal } from "@shared/schema";
import { db } from "../../db";
import { and, eq } from "drizzle-orm";

export class GoalsRepository {
  listByUser(userId: string): Promise<Goal[]> {
    return db.select().from(goals).where(eq(goals.userId, userId));
  }

  async create(data: InsertGoal): Promise<Goal> {
    const [goal] = await db.insert(goals).values(data).returning();
    return goal;
  }

  async update(
    id: number,
    userId: string,
    updates: Partial<InsertGoal>
  ): Promise<Goal | undefined> {
    const [goal] = await db
      .update(goals)
      .set(updates)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();
    return goal;
  }
}
