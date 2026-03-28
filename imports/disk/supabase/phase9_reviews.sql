-- =========================================================================
-- PHASE 9: REVIEW SYSTEM & AUTOMATED RATINGS
-- =========================================================================

-- 1. Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hostel_id UUID REFERENCES public.hostels(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add Row Level Security (RLS) Policies
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" 
ON public.reviews FOR SELECT 
USING (true);

CREATE POLICY "Students can create reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (
    auth.uid() = student_id 
    AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'student'
);

CREATE POLICY "Students can update own reviews" 
ON public.reviews FOR UPDATE 
USING (auth.uid() = student_id);

CREATE POLICY "Students can delete own reviews" 
ON public.reviews FOR DELETE 
USING (auth.uid() = student_id);

CREATE POLICY "Super admin can delete any review" 
ON public.reviews FOR DELETE 
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin');

-- 3. Trigger to Auto-Calculate Hostel Rating & Review Count
CREATE OR REPLACE FUNCTION public.update_hostel_rating()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.hostels
    SET 
      rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE hostel_id = NEW.hostel_id),
      reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE hostel_id = NEW.hostel_id)
    WHERE id = NEW.hostel_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.hostels
    SET 
      rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE hostel_id = OLD.hostel_id), 0),
      reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE hostel_id = OLD.hostel_id)
    WHERE id = OLD.hostel_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the trigger to the reviews table
DROP TRIGGER IF EXISTS on_review_changed ON public.reviews;
CREATE TRIGGER on_review_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE PROCEDURE public.update_hostel_rating();
