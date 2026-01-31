import { SettingsRepository } from "./settings.repository";

export class SettingsService {
  constructor(private readonly repo = new SettingsRepository()) {}

  async getCurrency() {
    const row = await this.repo.get();
    return row?.currency ?? "BRL";
  }

  async setCurrency(currency: "BRL" | "USD") {
    return this.repo.upsert(currency);
  }
}
