-- Enable real-time for important tables

-- 1. Create publication if it doesn't already exist (Supabase usually has this by default, but it's good practice to ensure it exists)
-- DO $$ 
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
--         CREATE PUBLICATION supabase_realtime;
--     END IF;
-- END $$;

-- 2. Add the tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE room_types;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE hostels;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;

-- Note: Ensure that the 'auth.users' table or custom 'users' wrapper table is properly integrated if you are tracking user changes. 
-- In this case we add our public.users table.
