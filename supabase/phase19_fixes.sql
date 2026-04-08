-- ============================================
-- PHASE 19: Missing Fixes
-- ============================================

-- Fix: Allow users to update their own profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Fix: Enable real-time for Mission Control (Overview.tsx)
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hostels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
