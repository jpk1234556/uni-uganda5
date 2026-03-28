-- =========================================================================
-- PHASE 8: GRANT SUPER ADMIN ACCESS
-- =========================================================================

-- Replace the email below with the exact email you used to register
-- This upgrades that account to have full control over the admin dashboard
UPDATE public.users 
SET role = 'super_admin' 
WHERE email = 'pjulius793@gmail.com';
