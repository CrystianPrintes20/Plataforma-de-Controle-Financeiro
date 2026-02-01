-- Rename fixed_incomes table to income_entries
ALTER TABLE IF EXISTS fixed_incomes RENAME TO income_entries;

-- Rename sequence if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S' AND c.relname = 'fixed_incomes_id_seq'
  ) THEN
    ALTER SEQUENCE fixed_incomes_id_seq RENAME TO income_entries_id_seq;
    ALTER SEQUENCE income_entries_id_seq OWNED BY income_entries.id;
  END IF;
END $$;
