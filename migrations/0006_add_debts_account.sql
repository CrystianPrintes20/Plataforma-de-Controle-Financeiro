ALTER TABLE "debts" ADD COLUMN "account_id" integer REFERENCES "accounts" ("id");
