-- ==========================================
-- PHASE 14: THE FINAL MARKETPLACE FEATURES
-- Adds: Mobile Money Payments, Real-Time Messaging, Map Coordinates, Wishlists (Favorites), and Notifications
-- ==========================================

-- 1. MAPS: Add Latitude and Longitude to Hostels
ALTER TABLE public.hostels 
ADD COLUMN IF NOT EXISTS latitude numeric(10, 8),
ADD COLUMN IF NOT EXISTS longitude numeric(11, 8);


-- 2. PAYMENTS ENGINE (Mobile Money Integration prep)
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    amount numeric(10, 2) NOT NULL,
    currency text DEFAULT 'UGX',
    provider text NOT NULL, -- e.g., 'MTN_MOMO', 'AIRTEL_MONEY'
    transaction_id text UNIQUE, -- Flutterwave/Paystack reference ID
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Turn on Security for Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can see own payments" ON public.payments FOR SELECT USING (auth.uid() = student_id);
-- (Admin policies would go here when fully locking down RLS)


-- 3. REAL-TIME MESSAGING (WhatsApp style chat)
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Turn on Security for Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert their own messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);


-- 4. WISHLISTS / FAVORITES (Heart system)
CREATE TABLE IF NOT EXISTS public.favorites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    hostel_id uuid REFERENCES public.hostels(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(student_id, hostel_id) -- A student can only favorite a hostel once
);

-- Turn on Security for Favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = student_id);


-- 5. NOTIFICATION ENGINE
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'system' CHECK (type IN ('payment', 'booking', 'message', 'system')),
    is_read boolean DEFAULT false,
    link text, -- Optional internal router link when clicked (e.g. "/student/dashboard")
    created_at timestamptz DEFAULT now()
);

-- Turn on Security for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- ENABLE REALTIME ON NEW TABLES SO THE UI INSTANTLY UPDATES WITHOUT REFRESHING
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.payments;
