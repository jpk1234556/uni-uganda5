-- ============================================
-- PHASE 4: Admin Dashboard Updates & Polices
-- ============================================

-- 1. Add 'completed' status to bookings constraint
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE "bookings" ADD CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'completed'));

-- 2. Add UPDATE policy for Super Admins on Users Table
DROP POLICY IF EXISTS "Super admins can update users" ON "users";
CREATE POLICY "Super admins can update users"
  ON "users"
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'super_admin');

-- 3. Add DELETE policy for Super Admins on Users Table
DROP POLICY IF EXISTS "Super admins can delete users" ON "users";
CREATE POLICY "Super admins can delete users"
  ON "users"
  FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'super_admin');

-- 4. Add UPDATE policy for Super Admins on Bookings Table
DROP POLICY IF EXISTS "Super admins can update bookings" ON "bookings";
CREATE POLICY "Super admins can update bookings"
  ON "bookings"
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'super_admin');

-- 5. Add UPDATE policy for Hostel Owners on Bookings Table
DROP POLICY IF EXISTS "Hostel owners can update bookings" ON "bookings";
CREATE POLICY "Hostel owners can update bookings"
  ON "bookings"
  FOR UPDATE
  TO authenticated
  USING (
    "hostel_id" IN (
      SELECT "id" FROM "hostels" WHERE "owner_id" = (SELECT auth.uid())
    )
  );

-- 6. Add UPDATE policy for Super Admins on Payments Table
DROP POLICY IF EXISTS "Super admins can update payments" ON "payments";
CREATE POLICY "Super admins can update payments"
  ON "payments"
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'super_admin');
