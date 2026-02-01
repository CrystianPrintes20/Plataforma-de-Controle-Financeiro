-- Add month/year columns and drop starts_at/ends_at
ALTER TABLE IF EXISTS income_entries
  ADD COLUMN IF NOT EXISTS month integer,
  ADD COLUMN IF NOT EXISTS year integer;

UPDATE income_entries
SET
  month = EXTRACT(MONTH FROM starts_at),
  year = EXTRACT(YEAR FROM starts_at)
WHERE (month IS NULL OR year IS NULL) AND starts_at IS NOT NULL;

ALTER TABLE IF EXISTS income_entries
  ALTER COLUMN month SET NOT NULL,
  ALTER COLUMN year SET NOT NULL;

ALTER TABLE IF EXISTS income_entries
  DROP COLUMN IF EXISTS starts_at,
  DROP COLUMN IF EXISTS ends_at;
