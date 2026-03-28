-- PHASE 16 Q2: Current super admins
SELECT id, email, first_name, last_name, is_active, created_at, updated_at
FROM public.users
WHERE role = 'super_admin'
ORDER BY created_at ASC;
