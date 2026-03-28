-- ============================================
-- CREATE SUPER ADMIN WITH AUTH
-- This creates both the profile and auth user
-- ============================================

-- Step 1: Create the user profile
INSERT INTO "users" ("email", "first_name", "last_name", "role", "is_active")
VALUES (
  'admin@uninest.ug',
  'Super',
  'Admin',
  'super_admin',
  true
) ON CONFLICT (email) DO UPDATE
SET 
  "role" = 'super_admin',
  "is_active" = true,
  "updated_at" = now();

-- Step 2: Create auth user (run this in Supabase Auth section or use the dashboard)
-- Go to Supabase Dashboard → Authentication → Users → "Add user"
-- Email: admin@uninest.ug
-- Password: YourSecurePassword123!
-- Role: authenticated

-- OR use SQL (requires service role key):
-- INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
-- VALUES (
--   gen_random_uuid(),
--   'admin@uninest.ug',
--   now(),
--   now(),
--   now()
-- );

-- Step 3: Set password for the auth user
-- This must be done through the dashboard or invite system
