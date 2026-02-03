UPDATE "debts"
SET
  "payment_month" = CASE WHEN "month" = 12 THEN 1 ELSE "month" + 1 END,
  "payment_year" = CASE WHEN "month" = 12 THEN "year" + 1 ELSE "year" END;
