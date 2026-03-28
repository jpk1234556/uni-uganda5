-- =================================================================================
-- PHASE 16: ROLE AUDIT AND REMEDIATION
-- Goal: Audit existing role assignments and safely remediate suspicious privilege elevation.
-- =================================================================================

-- 1) Quick role distribution overview
SELECT role, COUNT(*) AS total
FROM public.users
GROUP BY role
ORDER BY role;

-- 2) List all current super admins
SELECT id, email, first_name, last_name, is_active, created_at, updated_at
FROM public.users
WHERE role = 'super_admin'
ORDER BY created_at ASC;

-- 3) Find users with unexpected/null roles (should be empty)
SELECT id, email, role, is_active, created_at
FROM public.users
WHERE role IS NULL
   OR role NOT IN ('student', 'hostel_owner', 'super_admin')
ORDER BY created_at DESC;

-- 4) Compare auth metadata requested role vs effective role in public.users
-- This helps identify accounts where metadata attempted elevated roles.
SELECT
  u.id,
  u.email,
  COALESCE(a.raw_user_meta_data->>'role', '(none)') AS metadata_role,
  u.role AS effective_role,
  u.created_at
FROM public.users u
LEFT JOIN auth.users a ON a.id = u.id
WHERE COALESCE(a.raw_user_meta_data->>'role', '(none)') <> u.role
ORDER BY u.created_at DESC;

-- 5) Optional hardening cleanup (UNCOMMENT ONLY AFTER REVIEW)
-- Downgrade all super_admin accounts except an allowlist to hostel_owner.
-- Replace allowlist emails before running.
--
-- UPDATE public.users
-- SET role = 'hostel_owner', updated_at = now()
-- WHERE role = 'super_admin'
--   AND email NOT IN (
--     'admin@uninest.ug'
--   );

-- 6) Optional cleanup of invalid roles (UNCOMMENT ONLY AFTER REVIEW)
-- UPDATE public.users
-- SET role = 'student', updated_at = now()
-- WHERE role IS NULL
--    OR role NOT IN ('student', 'hostel_owner', 'super_admin');

-- 7) Post-remediation verification
-- SELECT role, COUNT(*) AS total
-- FROM public.users
-- GROUP BY role
-- ORDER BY role;
