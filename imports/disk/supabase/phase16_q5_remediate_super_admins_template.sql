-- PHASE 16 Q5: Optional remediation template
-- IMPORTANT: Review results first, then replace allowlist emails.
UPDATE public.users
SET role = 'hostel_owner', updated_at = now()
WHERE role = 'super_admin'
  AND email NOT IN (
    'admin@uninest.ug'
  );
