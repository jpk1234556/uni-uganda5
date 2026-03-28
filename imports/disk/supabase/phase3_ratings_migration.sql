-- Phase 3 Migration: Add Ratings and Reviews Count to Hostels Table
-- Description: Adds 'rating' (numeric out of 5.0) and 'reviews_count' (integer) to the existing hostels table.

-- 1. Add new columns to the hostels table
ALTER TABLE public.hostels 
ADD COLUMN rating numeric(3, 2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN reviews_count integer DEFAULT 0 CHECK (reviews_count >= 0);

-- Note: In a fully scaled application, 'rating' and 'reviews_count' might be computed 
-- dynamically from a separate 'reviews' table. For now, we are storing them directly on 
-- the hostel record for rapid frontend fetching and MVP sorting.

-- Optional: If you want to back-fill some mock ratings for your existing data so they show up beautifully right away:
-- UPDATE public.hostels SET rating = 4.5, reviews_count = 120 WHERE status = 'approved';
