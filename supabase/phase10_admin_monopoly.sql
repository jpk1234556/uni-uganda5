-- =================================================================================
-- PHASE 10: ADMIN MONOPOLY
-- Goal: Shift all listing creation and booking management powers to 'super_admin'
-- =================================================================================

-- ---------------------------------------------------------------------------------
-- 1. HOSTELS TABLE POLICIES
-- ---------------------------------------------------------------------------------
-- Drop old owner policies
DROP POLICY IF EXISTS "Owners can insert own hostels" ON public.hostels;
DROP POLICY IF EXISTS "Owners can update own hostels" ON public.hostels;
DROP POLICY IF EXISTS "Owners can delete own hostels" ON public.hostels;

-- Create new Super Admin explicit policies
CREATE POLICY "Super admin can insert hostels" 
ON public.hostels FOR INSERT 
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin');

CREATE POLICY "Super admin can update hostels" 
ON public.hostels FOR UPDATE 
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin');

CREATE POLICY "Super admin can delete hostels" 
ON public.hostels FOR DELETE 
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin');

-- ---------------------------------------------------------------------------------
-- 2. ROOM TYPES TABLE POLICIES
-- ---------------------------------------------------------------------------------
-- Drop old owner policies
DROP POLICY IF EXISTS "Owners can manage room types" ON public.room_types;

-- Create new Super Admin explicit policies for Room Types
CREATE POLICY "Super admin can insert room types" 
ON public.room_types FOR INSERT 
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin');

CREATE POLICY "Super admin can update room types" 
ON public.room_types FOR UPDATE 
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin');

CREATE POLICY "Super admin can delete room types" 
ON public.room_types FOR DELETE 
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin');

-- ---------------------------------------------------------------------------------
-- 3. BOOKINGS TABLE POLICIES
-- ---------------------------------------------------------------------------------
-- Drop old owner policies if they exist (usually owners updated them)
DROP POLICY IF EXISTS "Owners can view bookings for their hostels" ON public.bookings;
DROP POLICY IF EXISTS "Owners can update bookings for their hostels" ON public.bookings;

-- Ensure Super Admin mapping
-- Currently, we might have an "Admin full access" policy, let's make it explicit for bookings.
DROP POLICY IF EXISTS "Super admin can update any booking" ON public.bookings;
CREATE POLICY "Super admin can update any booking" 
ON public.bookings FOR UPDATE 
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin');

-- Note: The admin can already view all bookings due to existing SELECT policies,
-- but this update policy ensures ONLY admins (or students for themselves) can update statuses.
-- We must make sure students cannot update their own booking statuses to "approved".
-- Let's lock down student UPDATE.
DROP POLICY IF EXISTS "Students can update own bookings" ON public.bookings;
-- (If students could update their own bookings, they might approve themselves.)
