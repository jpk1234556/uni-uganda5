-- ============================================
-- PHASE 5: Student Booking Data Inserts
-- ============================================

-- Ensure Students can insert their own bookings
DROP POLICY IF EXISTS "Students can insert bookings" ON "bookings";
CREATE POLICY "Students can insert bookings"
  ON "bookings"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    "student_id" = auth.uid()
  );

-- Ensure Students can insert pending payments to confirm Mobile Money transfers
DROP POLICY IF EXISTS "Students can insert payments" ON "payments";
CREATE POLICY "Students can insert payments"
  ON "payments"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    "student_id" = auth.uid()
  );
