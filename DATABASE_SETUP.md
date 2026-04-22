# 🗄️ Database Setup Checklist for Uni-Nest

Complete this checklist to properly configure your Supabase database for production.

---

## ✅ Pre-Setup

- [ ] Create Supabase account at [supabase.com](https://supabase.com)
- [ ] Create a new project (choose region closest to your users)
- [ ] Save your project URL and anon key (you'll need these for .env.local)
- [ ] Access SQL Editor in Supabase Dashboard

---

## 📝 Step 1: Run Core Migrations

Run these SQL files **in order** in the Supabase SQL Editor:

### Phase 1 - Foundation
- [ ] `complete_migration.sql` - Main migration with user suspension & payments

### Phase 2 - Feature Additions  
- [ ] `phase2_superadmin_migration.sql` - Super admin enhancements
- [ ] `phase3_ratings_migration.sql` - Rating and review counts
- [ ] `phase4_admin_updates.sql` - Admin control features
- [ ] `phase4_bookings_migration.sql` - Detailed booking fields

### Phase 3 - User Management
- [ ] `phase5_student_inserts.sql` - Sample student data (optional)
- [ ] `phase6_auth_trigger.sql` - Authentication triggers (CRITICAL)
- [ ] `phase7_cleanup.sql` - Database cleanup
- [ ] `phase8_make_admin.sql` - Admin role setup

### Phase 4 - Reviews & Permissions
- [ ] `phase9_reviews.sql` - Review system
- [ ] `phase10_admin_monopoly.sql` - Admin-only listing/booking control (CRITICAL)
- [ ] `phase11_rich_rooms.sql` - Enhanced room types
- [ ] `phase12_auth_fixes.sql` - Authentication fixes

### Phase 5 - Realtime Features
- [ ] `phase13_realtime.sql` - Enable realtime subscriptions
- [ ] `phase14_final_features.sql` - Final features and notifications

### Phase 6 - Marketplace Checkout Core
- [ ] `phase25_marketplace_checkout_core.sql` - Cart, checkout intents, inventory holds, and transactional booking finalize functions

---

## 👤 Step 2: Create Super Admin User

### Option A: Via SQL (Recommended)

```sql
-- 1. Create auth user first (use a strong password!)
-- Note: You'll need to do this via Supabase Auth UI or signup flow

-- 2. After signing up, get the user ID and update role
-- Find your user by email
SELECT id, email FROM auth.users WHERE email = 'admin@uninest.ug';

-- 3. Update the public.users table with super_admin role
UPDATE public.users 
SET role = 'super_admin', 
    is_active = true,
    first_name = 'Super',
    last_name = 'Admin'
WHERE email = 'admin@uninest.ug';
```

### Option B: Via Signup Flow

1. Go to your deployed admin app
2. Click "Register"
3. Use admin email: `admin@uninest.ug`
4. After signup, manually update role in Supabase:
   ```sql
   UPDATE public.users SET role = 'super_admin' WHERE email = 'admin@uninest.ug';
   ```

---

## 🔐 Step 3: Verify Security Policies

Check that Row Level Security (RLS) is enabled:

```sql
-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

### Critical Policies to Verify

```sql
-- Check users table policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Check hostels table policies
SELECT * FROM pg_policies WHERE tablename = 'hostels';

-- Check bookings table policies
SELECT * FROM pg_policies WHERE tablename = 'bookings';
```

Expected policies:
- ✅ Users can read own data
- ✅ Super admins can read/write all
- ✅ Students can create bookings
- ✅ Owners can view bookings for their hostels

---

## ⚡ Step 4: Enable Realtime

Ensure realtime is enabled for live updates:

```sql
-- Verify realtime publication exists
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Check which tables have realtime enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

Should include:
- `hostels`
- `room_types`
- `bookings`
- `users`
- `reviews`
- `payments` (if exists)
- `notifications` (if exists)

If any are missing, run:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE hostels;
ALTER PUBLICATION supabase_realtime ADD TABLE room_types;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
```

---

## 🧪 Step 5: Test Database Connection

Create a test query to verify everything works:

```sql
-- Test 1: Can read users
SELECT COUNT(*) FROM users;

-- Test 2: Can read hostels
SELECT COUNT(*) FROM hostels;

-- Test 3: Check auth trigger exists
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
```

---

## 🔧 Step 6: Configure Supabase Auth

### Email Settings (Optional but Recommended)

1. Go to **Authentication** → **Email Templates**
2. Customize verification email template
3. Add your app logo and branding

### Password Policy

1. Go to **Authentication** → **Policies**
2. Set minimum password length: `6` (or higher for production)
3. Enable email confirmation (recommended)

### Allowed Referrers (CORS)

1. Go to **Settings** → **API**
2. Under "Allowed Referrers", add:
   - `https://your-student-domain.com`
   - `https://your-owner-domain.com`
   - `https://your-admin-domain.com`
   - `http://localhost:*` (for development)

---

## 📊 Step 7: Create Sample Data (Optional)

For testing purposes:

```sql
-- Sample hostel
INSERT INTO hostels (id, name, description, university, address, price_range, owner_id, status, rating, reviews_count)
VALUES (
  gen_random_uuid(),
  'Test Hostel',
  'A comfortable student accommodation',
  'Makerere University',
  'Kampala, Uganda',
  'UGX 500,000 - 1,500,000',
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1),
  'approved',
  4.5,
  10
);
```

---

## ✅ Verification Checklist

After completing setup, verify:

- [ ] All migrations ran without errors
- [ ] Super admin user exists with correct role
- [ ] RLS enabled on all tables
- [ ] Auth trigger exists (`handle_new_user`)
- [ ] Realtime enabled for critical tables
- [ ] Can query all tables without permission errors
- [ ] CORS configured for production domains
- [ ] Email templates customized

---

## 🚨 Common Issues

### "relation does not exist" error
**Solution**: You missed a migration. Run all SQL files in order.

### "permission denied" error
**Solution**: Check RLS policies. Ensure you're logged in as the correct role.

### Auth trigger not working
**Solution**: Re-run `phase6_auth_trigger.sql` and verify it's in `pg_proc`.

### Realtime not updating
**Solution**: Verify publication exists and tables are added to it.

---

## 📞 Next Steps

After database setup:
1. ✅ Copy `.env.example` to `.env.local` and add credentials
2. ✅ Run `npm install`
3. ✅ Test locally with `npm run dev:student`
4. ✅ Deploy to production (see DEPLOYMENT.md)

---

**Database Version**: 1.0.0  
**Last Updated**: March 2026
