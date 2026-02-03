CREATE TABLE "investment_entries" (
  "id" serial PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id"),
  "investment_id" integer NOT NULL REFERENCES "investments"("id"),
  "year" integer NOT NULL,
  "month" integer NOT NULL,
  "value" numeric(12,2) NOT NULL,
  "created_at" timestamp DEFAULT now()
);
