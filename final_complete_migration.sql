-- ============================================
-- FINAL COMPLETE MIGRATION SCRIPT
-- Uni-Nest Uganda - All Phases Combined
-- Run this all at once in Supabase SQL Editor
-- ============================================

-- ============================================
-- CLEANUP: Disable RLS and Drop Existing Objects
-- ============================================

-- Disable RLS on tables to allow modifications
ALTER TABLE IF EXISTS "payments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "bookings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "room_types" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "hostels" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "users" DISABLE ROW LEVEL SECURITY;

-- Drop policies
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can view own profile" ON "users";
    DROP POLICY IF EXISTS "Super admins can view all users" ON "users";
  END IF;

  IF to_regclass('public.hostels') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Anyone can view approved hostels" ON "hostels";
    DROP POLICY IF EXISTS "Hostel owners can manage their hostels" ON "hostels";
    DROP POLICY IF EXISTS "Super admins can manage all hostels" ON "hostels";
  END IF;

  IF to_regclass('public.room_types') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Anyone can view room types for approved hostels" ON "room_types";
    DROP POLICY IF EXISTS "Hostel owners can manage their room types" ON "room_types";
  END IF;

  IF to_regclass('public.bookings') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Students can view own bookings" ON "bookings";
    DROP POLICY IF EXISTS "Hostel owners can view bookings for their hostels" ON "bookings";
    DROP POLICY IF EXISTS "Super admins can view all bookings" ON "bookings";
  END IF;

  IF to_regclass('public.payments') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Super admins can view all payments" ON "payments";
    DROP POLICY IF EXISTS "Hostel owners can view their payments" ON "payments";
    DROP POLICY IF EXISTS "Students can view own payments" ON "payments";
  END IF;
END $$;

-- Drop functions
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS update_updated_at_column();
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS update_users_updated_at ON "users";
  END IF;

  IF to_regclass('public.hostels') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS update_hostels_updated_at ON "hostels";
  END IF;

  IF to_regclass('public.room_types') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS update_room_types_updated_at ON "room_types";
  END IF;

  IF to_regclass('public.bookings') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS update_bookings_updated_at ON "bookings";
  END IF;

  IF to_regclass('public.payments') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS update_payments_updated_at ON "payments";
  END IF;
END $$;

-- ============================================
-- PHASE 1: Core Tables
-- ============================================

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text UNIQUE NOT NULL,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "role" text NOT NULL CHECK (role IN ('student', 'hostel_owner', 'super_admin')) DEFAULT 'student',
  "is_active" BOOLEAN DEFAULT true,
  "phone_number" text,
  "course" text,
  "next_of_kin" text,
  "medical_history" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Create hostels table
CREATE TABLE IF NOT EXISTS "hostels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "description" text,
  "university" text,
  "address" text,
  "price_range" text,
  "amenities" text[],
  "images" text[],
  "owner_id" uuid NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "status" text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  "rating" numeric(3, 2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  "reviews_count" integer DEFAULT 0 CHECK (reviews_count >= 0),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Create room_types table
CREATE TABLE IF NOT EXISTS "room_types" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "hostel_id" uuid NOT NULL REFERENCES "hostels"(id) ON DELETE CASCADE,
  "name" text NOT NULL,
  "price" numeric(10,2) NOT NULL,
  "capacity" integer NOT NULL,
  "available" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS "bookings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "student_id" uuid NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "hostel_id" uuid NOT NULL REFERENCES "hostels"(id) ON DELETE CASCADE,
  "room_type_id" uuid NOT NULL REFERENCES "room_types"(id) ON DELETE CASCADE,
  "phone_number" text,
  "course" text,
  "move_in_date" date,
  "duration" text,
  "next_of_kin" text,
  "sponsor" text,
  "origin" text,
  "medical_history" text,
  "special_requests" text,
  "status" text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- PHASE 2: Enhanced Payments Table
-- ============================================

CREATE TABLE IF NOT EXISTS "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "booking_id" uuid NOT NULL REFERENCES "bookings"(id) ON DELETE CASCADE,
  "student_id" uuid NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "hostel_owner_id" uuid NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "amount" numeric(12,2) NOT NULL,
  "platform_fee" numeric(10,2) NOT NULL DEFAULT 0.00,
  "currency" varchar(10) NOT NULL DEFAULT 'UGX',
  "status" varchar(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  "metadata" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- PHASE 3: Enable Row Level Security
-- ============================================

-- Enable RLS on all tables
ALTER TABLE IF EXISTS "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "hostels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "room_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PHASE 4: RLS Policies
-- ============================================

-- Create a security definer function to check user roles without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- Users Table Policies
DROP POLICY IF EXISTS "Users can view own profile" ON "users";
DROP POLICY IF EXISTS "Super admins can view all users" ON "users";

CREATE POLICY "Users can view own profile"
  ON "users"
  FOR SELECT
  TO authenticated
  USING ("id" = (SELECT auth.uid()));

CREATE POLICY "Super admins can view all users"
  ON "users"
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'super_admin');

-- Hostels Table Policies
DROP POLICY IF EXISTS "Anyone can view approved hostels" ON "hostels";
DROP POLICY IF EXISTS "Hostel owners can manage their hostels" ON "hostels";
DROP POLICY IF EXISTS "Super admins can manage all hostels" ON "hostels";

CREATE POLICY "Anyone can view approved hostels"
  ON "hostels"
  FOR SELECT
  USING ("status" = 'approved');

CREATE POLICY "Hostel owners can manage their hostels"
  ON "hostels"
  FOR ALL
  TO authenticated
  USING ("owner_id" = (SELECT auth.uid()));

CREATE POLICY "Super admins can manage all hostels"
  ON "hostels"
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'super_admin');

-- Room Types Policies
DROP POLICY IF EXISTS "Anyone can view room types for approved hostels" ON "room_types";
DROP POLICY IF EXISTS "Hostel owners can manage their room types" ON "room_types";

CREATE POLICY "Anyone can view room types for approved hostels"
  ON "room_types"
  FOR SELECT
  USING (
    "hostel_id" IN (
      SELECT "id" FROM "hostels" WHERE "status" = 'approved'
    )
  );

CREATE POLICY "Hostel owners can manage their room types"
  ON "room_types"
  FOR ALL
  TO authenticated
  USING (
    "hostel_id" IN (
      SELECT "id" FROM "hostels" WHERE "owner_id" = (SELECT auth.uid())
    )
  );

-- Bookings Table Policies
DROP POLICY IF EXISTS "Students can view own bookings" ON "bookings";
DROP POLICY IF EXISTS "Hostel owners can view bookings for their hostels" ON "bookings";
DROP POLICY IF EXISTS "Super admins can view all bookings" ON "bookings";

CREATE POLICY "Students can view own bookings"
  ON "bookings"
  FOR SELECT
  TO authenticated
  USING ("student_id" = (SELECT auth.uid()));

CREATE POLICY "Hostel owners can view bookings for their hostels"
  ON "bookings"
  FOR SELECT
  TO authenticated
  USING (
    "hostel_id" IN (
      SELECT "id" FROM "hostels" WHERE "owner_id" = (SELECT auth.uid())
    )
  );

CREATE POLICY "Super admins can view all bookings"
  ON "bookings"
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'super_admin');

-- Payments Table Policies
DROP POLICY IF EXISTS "Super admins can view all payments" ON "payments";
DROP POLICY IF EXISTS "Hostel owners can view their payments" ON "payments";
DROP POLICY IF EXISTS "Students can view own payments" ON "payments";

CREATE POLICY "Super admins can view all payments"
  ON "payments"
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'super_admin');

CREATE POLICY "Hostel owners can view their payments"
  ON "payments"
  FOR SELECT
  TO authenticated
  USING ("hostel_owner_id" = (SELECT auth.uid()));

CREATE POLICY "Students can view own payments"
  ON "payments"
  FOR SELECT
  TO authenticated
  USING ("student_id" = (SELECT auth.uid()));

-- ============================================
-- PHASE 5: Indexes for Performance
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON "users" ("email");
CREATE INDEX IF NOT EXISTS idx_users_role ON "users" ("role");
CREATE INDEX IF NOT EXISTS idx_users_is_active ON "users" ("is_active");

-- Hostels indexes
CREATE INDEX IF NOT EXISTS idx_hostels_owner_id ON "hostels" ("owner_id");
CREATE INDEX IF NOT EXISTS idx_hostels_status ON "hostels" ("status");
CREATE INDEX IF NOT EXISTS idx_hostels_rating ON "hostels" ("rating");

-- Room types indexes
CREATE INDEX IF NOT EXISTS idx_room_types_hostel_id ON "room_types" ("hostel_id");

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON "bookings" ("student_id");
CREATE INDEX IF NOT EXISTS idx_bookings_hostel_id ON "bookings" ("hostel_id");
CREATE INDEX IF NOT EXISTS idx_bookings_status ON "bookings" ("status");

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON "payments" ("booking_id");
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON "payments" ("student_id");
CREATE INDEX IF NOT EXISTS idx_payments_hostel_owner_id ON "payments" ("hostel_owner_id");
CREATE INDEX IF NOT EXISTS idx_payments_status ON "payments" ("status");

-- ============================================
-- PHASE 6: Functions and Triggers for Updated At
-- ============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON "users";
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON "users"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hostels_updated_at ON "hostels";
CREATE TRIGGER update_hostels_updated_at
    BEFORE UPDATE ON "hostels"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_room_types_updated_at ON "room_types";
CREATE TRIGGER update_room_types_updated_at
    BEFORE UPDATE ON "room_types"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON "bookings";
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON "bookings"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON "payments";
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON "payments"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PHASE 7: Sample Data (Optional - Uncomment if needed)
-- ============================================

-- Sample Super Admin User
-- INSERT INTO "users" ("id", "email", "first_name", "last_name", "role", "is_active")
-- VALUES (
--   gen_random_uuid(),
--   'admin@uninest.ug',
--   'Super',
--   'Admin',
--   'super_admin',
--   true
-- ) ON CONFLICT (email) DO NOTHING;

-- Sample Hostel Owner
-- INSERT INTO "users" ("id", "email", "first_name", "last_name", "role", "is_active")
-- VALUES (
--   gen_random_uuid(),
--   'owner@hostel.com',
--   'John',
--   'Doe',
--   'hostel_owner',
--   true
-- ) ON CONFLICT (email) DO NOTHING;

-- Sample Student
-- INSERT INTO "users" ("id", "email", "first_name", "last_name", "role", "is_active")
-- VALUES (
--   gen_random_uuid(),
--   'student@university.ug',
--   'Jane',
--   'Smith',
--   'student',
--   true
-- ) ON CONFLICT (email) DO NOTHING;

-- Update existing hostels with sample ratings
-- UPDATE "hostels" 
-- SET "rating" = 4.5, "reviews_count" = 120 
-- WHERE "status" = 'approved' AND "rating" = 0.0;
