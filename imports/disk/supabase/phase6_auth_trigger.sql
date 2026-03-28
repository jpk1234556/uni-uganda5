-- =========================================================================
-- PHASE 6: AUTHENTICATION TRIGGER & DATA BACKFILL
-- =========================================================================

-- 1. Create a function to handle new user signups
-- This ensures that when a user registers via Supabase Auth, they automatically get a row in the public.users table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, first_name, last_name, email, role, is_active)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'role', 'student'),
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger to execute the function every time a user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. BACKFILL EXISTING USERS
-- Since you already created your accounts before this trigger existed, this snippet instantly copies your missing accounts into the public.users table!
INSERT INTO public.users (id, first_name, last_name, email, role, is_active)
SELECT 
  id, 
  raw_user_meta_data->>'first_name', 
  raw_user_meta_data->>'last_name', 
  email, 
  COALESCE(raw_user_meta_data->>'role', 'student'),
  true
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);
