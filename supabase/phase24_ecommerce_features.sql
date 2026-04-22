-- phase24_ecommerce_features.sql
-- Add category column to hostels if it doesn't exist

DO $$
BEGIN
    IF to_regclass('public.hostels') IS NULL THEN
        RAISE EXCEPTION 'Missing table public.hostels. Run final_complete_migration.sql (or complete_migration.sql + prior phases) before phase24_ecommerce_features.sql.';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'hostels' AND column_name = 'category'
    ) THEN
        ALTER TABLE public.hostels ADD COLUMN category text DEFAULT 'Hostel';
    END IF;
END $$;
