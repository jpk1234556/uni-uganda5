-- Phase 4 Migration: Add Detailed Tracking Fields to Bookings Table
-- Description: Adds all necessary fields to support the multi-step, detailed booking wizard.
-- These fields allow the Super Admin to safely track students and their guardians.

ALTER TABLE public.bookings 
ADD COLUMN move_in_date date,
ADD COLUMN duration text,
ADD COLUMN phone_number text,
ADD COLUMN course text,
ADD COLUMN next_of_kin text,
ADD COLUMN sponsor text,
ADD COLUMN origin text,
ADD COLUMN medical_history text,
ADD COLUMN special_requests text;

-- Note: In a fully normalized database, 'phone_number', 'next_of_kin', 'sponsor', 'origin', 
-- and 'medical_history' might actually live on the 'users' or a 'student_profiles' table 
-- to prevent data duplication. However, adding them here allows a student to safely book
-- immediately without forcing a separate "Complete Profile" flow first, matching your UX goals.
