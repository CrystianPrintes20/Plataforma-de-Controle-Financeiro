import "dotenv/config";
import { validateEnv } from "../shared/middlewares/validate-env";

const parsed = validateEnv();

export const env = {
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT,
  databaseUrl: parsed.DATABASE_URL,
  sessionSecret: parsed.SESSION_SECRET,
  authEmail: parsed.AUTH_EMAIL,
  authPassword: parsed.AUTH_PASSWORD,
  currency: parsed.CURRENCY,
  incomeBalanceFromYear: parsed.INCOME_BALANCE_FROM_YEAR,
  incomeBalanceFromMonth: parsed.INCOME_BALANCE_FROM_MONTH,
};
