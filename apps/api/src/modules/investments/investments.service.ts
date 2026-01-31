import type { Investment, InsertInvestment } from "@shared/schema";
import { InvestmentsRepository } from "./investments.repository";

export class InvestmentsService {
  constructor(private readonly repo = new InvestmentsRepository()) {}

  list(userId: string): Promise<Investment[]> {
    return this.repo.listByUser(userId);
  }

  create(input: InsertInvestment): Promise<Investment> {
    return this.repo.create(input);
  }
}
