# 🚀 Uni-Nest Production Deployment Guide

Complete guide for deploying the Uni-Nest hostel booking platform to production.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Setup](#local-setup)
3. [Database Configuration](#database-configuration)
4. [Build & Test](#build--test)
5. [Deployment Options](#deployment-options)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

Before deploying, ensure you have:

- ✅ **Node.js** v18+ and npm installed
- ✅ **Supabase account** with a project created
- ✅ **Git** installed (for version control)
- ✅ **Hosting platform account** (Vercel, Netlify, or similar)

---

## 💻 Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon/public key**

### 3. Verify Configuration

```bash
# Test the student app
npm run dev:student

# Test the owner app
npm run dev:owner

# Test the admin app
npm run dev:admin
```

Each should start without errors.

---

## 🗄️ Database Configuration

### Run SQL Migrations

Execute these SQL files in your Supabase SQL Editor **in order**:

1. **Main Migration**: `complete_migration.sql`
2. **Phase Migrations** (if needed):
   - `phase2_superadmin_migration.sql`
   - `phase3_ratings_migration.sql`
   - `phase4_admin_updates.sql`
   - `phase4_bookings_migration.sql`
   - `phase5_student_inserts.sql`
   - `phase6_auth_trigger.sql`
   - `phase7_cleanup.sql`
   - `phase8_make_admin.sql`
   - `phase9_reviews.sql`
   - `phase10_admin_monopoly.sql`
   - `phase11_rich_rooms.sql`
   - `phase12_auth_fixes.sql`
   - `phase13_realtime.sql`
   - `phase14_final_features.sql`

### Create Initial Super Admin

Use this SQL template to create your first super admin:

```sql
-- Replace with your details
INSERT INTO users (id, email, first_name, last_name, role, is_active) 
VALUES (
  gen_random_uuid(), 
  'admin@uninest.ug', 
  'Super', 
  'Admin', 
  'super_admin', 
  true
);
```

Then create the auth user via Supabase Authentication or sign up through the app.

---

## 🔨 Build & Test

### 1. Build All Applications

```bash
# Build all three apps
npm run build:all
```

### 2. Check for Errors

Verify each app builds successfully:
- ✅ `apps/student/dist/` exists
- ✅ `apps/owner/dist/` exists
- ✅ `apps/admin/dist/` exists

### 3. Preview Production Build Locally

```bash
# Preview student app
npx serve apps/student/dist

# Preview owner app
npx serve apps/owner/dist

# Preview admin app
npx serve apps/admin/dist
```

Test critical flows:
- User registration
- Login/logout
- Browse hostels
- Create bookings
- Admin dashboard access

---

## 🌐 Deployment Options

### Option A: Deploy as Separate Apps (Recommended)

Deploy each workspace as an independent application.

#### **Vercel Deployment**

**Student App:**
1. Connect GitHub repo to Vercel
2. Set Root Directory: `apps/student`
3. Add environment variables
4. Deploy

**Owner App:**
1. Same as above but Root Directory: `apps/owner`

**Admin App:**
1. Same as above but Root Directory: `apps/admin`

**Vercel Configuration:**

For each app, use these settings:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `cd ../.. && npm install`

**vercel.json** (already configured in each app):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### **Netlify Deployment**

**Build Settings:**
- **Base directory**: `apps/student` (or `apps/owner`, `apps/admin`)
- **Build command**: `npm run build`
- **Publish directory**: `apps/student/dist`

**netlify.toml** (create in each app folder):
```toml
[build]
  base = "apps/student"
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Option B: Single Monorepo Deployment

Deploy as one unified application with routing.

**Note**: Requires custom server configuration for routing.

---

## ⚙️ Environment Variables for Hosting Platform

Add these to your hosting platform for **EACH** app:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Your Supabase anon/public key |

**Vercel**: Project Settings → Environment Variables  
**Netlify**: Site Settings → Environment Variables → Edit variables

---

## ✅ Post-Deployment Checklist

After deploying, verify:

### Student App
- [ ] Homepage loads correctly
- [ ] Can browse hostels
- [ ] Search functionality works
- [ ] Can view hostel details
- [ ] Registration creates new users
- [ ] Login works
- [ ] Can submit booking requests
- [ ] Student dashboard accessible

### Owner App
- [ ] Owner login works
- [ ] Dashboard loads
- [ ] Can view bookings (if any)

### Admin App
- [ ] Super admin can log in
- [ ] Dashboard shows metrics
- [ ] Can manage users
- [ ] Can manage hostels
- [ ] Can view payments
- [ ] All CRUD operations work

### Security
- [ ] Protected routes redirect unauthenticated users
- [ ] Role-based access control working
- [ ] RLS policies active in Supabase
- [ ] No console errors about missing env vars

---

## 🔍 Troubleshooting

### Build Fails with "Module not found"

**Solution**: Ensure all workspace dependencies are installed:
```bash
npm install
```

Check that `packages/shared` and `packages/ui` exist.

### Environment Variables Not Working

**Solution**: 
1. Verify `.env.local` exists in correct location
2. Restart dev server after adding variables
3. For production, add variables in hosting platform dashboard
4. Variables must be prefixed with `VITE_` to be exposed to client

### "Supabase not configured" Error

**Solution**: Check that both environment variables are set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Admin Cannot Access Dashboard

**Solution**: 
1. Verify user has `super_admin` role in database
2. Check RLS policies in Supabase
3. Clear browser cache and cookies
4. Re-login after role changes

### Real-time Updates Not Working

**Solution**: 
1. Ensure realtime is enabled in Supabase:
   ```sql
   alter publication supabase_realtime add table bookings;
   alter publication supabase_realtime add table hostels;
   alter publication supabase_realtime add table room_types;
   ```
2. Check browser console for WebSocket errors

### CORS Errors

**Solution**: Add your domain to Supabase allowed origins:
1. Go to Supabase Dashboard → Settings → API
2. Add your production domain to "Allowed Referrers"

---

## 📊 Monitoring & Maintenance

### Recommended Tools

1. **Error Tracking**: Sentry, LogRocket
2. **Analytics**: Google Analytics, Plausible
3. **Performance**: Vercel Analytics, WebPageTest
4. **Uptime**: UptimeRobot, Pingdom

### Regular Maintenance

- Monitor Supabase usage and costs
- Review error logs weekly
- Update dependencies monthly
- Backup database regularly
- Audit user permissions quarterly

---

## 🎯 Quick Deploy Commands

```bash
# 1. Install dependencies
npm install

# 2. Build all apps
npm run build:all

# 3. Deploy to Vercel (from each app folder)
cd apps/student && vercel --prod
cd apps/owner && vercel --prod
cd apps/admin && vercel --prod
```

---

## 📞 Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review Supabase documentation
3. Check Vercel/Netlify deployment logs
4. Examine browser console for errors

---

**Last Updated**: March 2026  
**Version**: 1.0.0
