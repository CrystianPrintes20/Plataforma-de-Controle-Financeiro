import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const envSchema = z.object({
  NODE_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(["development", "test", "production"]).default("development")
  ),
  PORT: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().default(5003)
  ),
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().min(1)),
  SESSION_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().min(1).default("dev-session-secret")
  ),
  AUTH_EMAIL: z.preprocess(
    emptyToUndefined,
    z.string().email().default("local@dev")
  ),
  AUTH_PASSWORD: z.preprocess(
    emptyToUndefined,
    z.string().min(4).default("dev-password")
  ),
  CURRENCY: z.preprocess(
    emptyToUndefined,
    z.enum(["BRL", "USD"]).default("BRL")
  ),
  INCOME_BALANCE_FROM_YEAR: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().default(2026)
  ),
  INCOME_BALANCE_FROM_MONTH: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(12).default(2)
  ),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  return envSchema.parse(process.env);
}
