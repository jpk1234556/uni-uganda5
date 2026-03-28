-- =================================================================================
-- PHASE 15: SECURE ROLE ASSIGNMENT ON SIGNUP
-- Goal: Prevent client-controlled metadata from escalating privileges (e.g. super_admin)
-- =================================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  requested_role text;
  safe_role text;
BEGIN
  requested_role := lower(COALESCE(NEW.raw_user_meta_data->>'role', 'student'));

  -- Never trust privileged roles from client metadata.
  -- Allow self-registration only for student/hostel_owner.
  IF requested_role IN ('student', 'hostel_owner') THEN
    safe_role := requested_role;
  ELSE
    safe_role := 'student';
  END IF;

  INSERT INTO public.users (id, email, first_name, last_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
    safe_role,
    true
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
