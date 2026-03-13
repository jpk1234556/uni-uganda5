-- Run this in your Supabase SQL Editor

-- 1. Add 'is_active' column to users for suspension
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;

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
CREATE POLICY "Super admins can view all payments" ON payments
  FOR SELECT USING (public.get_user_role() = 'super_admin');

-- Allow hostel_owners to read payments related to their hostels
CREATE POLICY "Owners can view their payments" ON payments
  FOR SELECT USING (
    hostel_owner_id = auth.uid()
  );

-- Allow students to read their own payments
CREATE POLICY "Students can view their payments" ON payments
  FOR SELECT USING (
    student_id = auth.uid()
  );
