-- 1. First, delete any 'ghost' or 'orphaned' records in public.users
-- This removes accounts that exist in public.users but NO LONGER exist in the private auth.users system 
-- (which is exactly why your email was throwing a duplicate error but different ID!)
DELETE FROM public.users 
WHERE id NOT IN (SELECT id FROM auth.users);


-- 2. Now properly copy the valid authenticated user over
INSERT INTO public.users (id, first_name, last_name, email, role, is_active)
SELECT 
  id, 
  raw_user_meta_data->>'first_name', 
  raw_user_meta_data->>'last_name', 
  email, 
  COALESCE(raw_user_meta_data->>'role', 'student'),
  true
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (email) DO UPDATE 
SET id = EXCLUDED.id;
