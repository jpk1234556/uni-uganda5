-- Complete Migration Script for Uni-Nest Uganda
-- Run this all at once in Supabase SQL Editor

-- ============================================
-- PHASE 2: User Suspension + Payments Table
-- ============================================

-- 1. Add 'is_active' column to users for suspension
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Create the payments tracking table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    hostel_owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL, -- The cut the super admin takes
    status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check user roles without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- Allow super_admin to read all payments
CREATE POLICY IF NOT EXISTS "Super admins can view all payments" ON payments
  FOR SELECT USING (public.get_user_role() = 'super_admin');

-- Allow hostel_owners to read payments related to their hostels
CREATE POLICY IF NOT EXISTS "Owners can view their payments" ON payments
  FOR SELECT USING (
    hostel_owner_id = auth.uid()
  );

-- Allow students to read their own payments
CREATE POLICY IF NOT EXISTS "Students can view their payments" ON payments
  FOR SELECT USING (
    student_id = auth.uid()
  );

-- ============================================
-- PHASE 3: Ratings and Reviews Count
-- ============================================

-- Add new columns to the hostels table
ALTER TABLE public.hostels 
ADD COLUMN IF NOT EXISTS rating numeric(3, 2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS reviews_count integer DEFAULT 0 CHECK (reviews_count >= 0);

-- ============================================
-- PHASE 4: Detailed Booking Fields
-- ============================================

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS move_in_date date,
ADD COLUMN IF NOT EXISTS duration text,
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS course text,
ADD COLUMN IF NOT EXISTS next_of_kin text,
ADD COLUMN IF NOT EXISTS sponsor text,
ADD COLUMN IF NOT EXISTS origin text,
ADD COLUMN IF NOT EXISTS medical_history text,
ADD COLUMN IF NOT EXISTS special_requests text;

-- ============================================
-- OPTIONAL: Add some sample data for testing
-- ============================================

-- Update existing approved hostels with sample ratings (uncomment if needed)
-- UPDATE public.hostels SET rating = 4.5, reviews_count = 120 WHERE status = 'approved' AND rating = 0.0;

-- Create a super admin user (uncomment and modify as needed)
-- INSERT INTO users (id, email, first_name, last_name, role, is_active) 
-- VALUES ('your-uuid-here', 'admin@uninest.ug', 'Super', 'Admin', 'super_admin', true);

COMMIT;
