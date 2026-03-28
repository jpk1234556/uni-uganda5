-- PHASE 16 Q6: Optional invalid-role cleanup
UPDATE public.users
SET role = 'student', updated_at = now()
WHERE role IS NULL
   OR role NOT IN ('student', 'hostel_owner', 'super_admin');
