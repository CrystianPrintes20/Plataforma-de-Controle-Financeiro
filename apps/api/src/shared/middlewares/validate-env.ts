import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(1).default("dev-session-secret"),
  AUTH_EMAIL: z.string().email().default("local@dev"),
  AUTH_PASSWORD: z.string().min(4).default("dev-password"),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  return envSchema.parse(process.env);
}
