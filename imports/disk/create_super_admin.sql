-- ============================================
-- CREATE SUPER ADMIN ACCOUNT
-- Run this in Supabase SQL Editor
-- ============================================

-- Option 1: Create Super Admin with specific email
INSERT INTO "users" ("id", "email", "first_name", "last_name", "role", "is_active")
VALUES (
  gen_random_uuid(),
  'admin@uninest.ug',  -- Change this to your desired admin email
  'Super',
  'Admin',
  'super_admin',
  true
) ON CONFLICT (email) DO UPDATE
SET 
  "role" = 'super_admin',
  "is_active" = true,
  "updated_at" = now();

-- Option 2: Create Super Admin with custom UUID (if you want to specify)
-- INSERT INTO "users" ("id", "email", "first_name", "last_name", "role", "is_active")
-- VALUES (
--   'your-specific-uuid-here',  -- Replace with your UUID
--   'your-email@domain.com',
--   'Your',
--   'Name',
--   'super_admin',
--   true
-- ) ON CONFLICT (email) DO UPDATE
-- SET 
--   "role" = 'super_admin',
--   "is_active" = true,
--   "updated_at" = now();

-- Verify the super admin was created
SELECT * FROM "users" WHERE "role" = 'super_admin';
