-- PHASE 16 Q3: Unexpected or null roles
SELECT id, email, role, is_active, created_at
FROM public.users
WHERE role IS NULL
   OR role NOT IN ('student', 'hostel_owner', 'super_admin')
ORDER BY created_at DESC;
