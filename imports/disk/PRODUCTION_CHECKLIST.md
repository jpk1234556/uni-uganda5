# ✅ Production Deployment Checklist

Use this checklist before deploying to production to ensure everything is ready.

---

## 🔧 Pre-Deployment Setup

### Environment Configuration
- [ ] `.env.local` file created in root directory
- [ ] Supabase URL configured correctly
- [ ] Supabase anon key configured correctly
- [ ] Environment variables added to hosting platform (Vercel, Netlify, etc.)
- [ ] `.env.local` added to `.gitignore` (should not be committed)

### Dependencies
- [ ] All dependencies installed (`npm install`)
- [ ] No outdated critical packages (React, Vite, Supabase client)
- [ ] `node_modules` excluded from git

---

## 🗄️ Database Configuration

### Supabase Setup
- [ ] Supabase project created
- [ ] Region selected (closest to target users)
- [ ] All SQL migrations run successfully
  - [ ] `complete_migration.sql`
  - [ ] `phase2_superadmin_migration.sql`
  - [ ] `phase3_ratings_migration.sql`
  - [ ] `phase4_admin_updates.sql`
  - [ ] `phase4_bookings_migration.sql`
  - [ ] `phase5_student_inserts.sql` (optional)
  - [ ] `phase6_auth_trigger.sql` ⚠️ CRITICAL
  - [ ] `phase7_cleanup.sql`
  - [ ] `phase8_make_admin.sql`
  - [ ] `phase9_reviews.sql`
  - [ ] `phase10_admin_monopoly.sql` ⚠️ CRITICAL
  - [ ] `phase11_rich_rooms.sql`
  - [ ] `phase12_auth_fixes.sql`
  - [ ] `phase13_realtime.sql`
  - [ ] `phase14_final_features.sql`

### Security
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Auth trigger `handle_new_user` exists
- [ ] Realtime enabled for required tables
- [ ] CORS allowed referrers configured
- [ ] Initial super admin user created
- [ ] Super admin role verified in database

---

## 💻 Local Testing

### Build Verification
```bash
npm run build:all
```
- [ ] Student app builds without errors
- [ ] Owner app builds without errors  
- [ ] Admin app builds without errors
- [ ] All `dist/` folders created

### Functionality Testing

#### Student App
- [ ] Homepage loads correctly
- [ ] Can browse hostels
- [ ] Search works
- [ ] Hostel detail page shows all information
- [ ] User registration creates account
- [ ] Email verification works (if enabled)
- [ ] Login works
- [ ] Protected routes redirect to auth
- [ ] Can submit booking request
- [ ] Student dashboard accessible

#### Owner App
- [ ] Owner login works
- [ ] Dashboard loads
- [ ] Can view property bookings

#### Admin App
- [ ] Super admin can log in
- [ ] Dashboard shows metrics
- [ ] Can access users management
- [ ] Can access hostels management
- [ ] Can access payments
- [ ] Role-based access working

---

## 🌐 Deployment Configuration

### Vercel Setup (or hosting platform)
- [ ] GitHub repository connected
- [ ] Three separate projects created (student, owner, admin)
- [ ] Root directories set correctly:
  - Student: `apps/student`
  - Owner: `apps/owner`
  - Admin: `apps/admin`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Install command: `cd ../.. && npm install`

### Environment Variables on Hosting Platform
For EACH app, add:
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`

### Domain Configuration (Optional)
- [ ] Custom domain purchased
- [ ] DNS records configured
- [ ] SSL certificate active (automatic with Vercel)

---

## 🚀 Deploy

### Initial Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy each app
cd apps/student && vercel --prod
cd ../owner && vercel --prod
cd ../admin && vercel --prod
```

- [ ] Student app deployed successfully
- [ ] Owner app deployed successfully
- [ ] Admin app deployed successfully
- [ ] No deployment errors
- [ ] Build logs show no warnings

---

## ✅ Post-Deployment Verification

### Student App (https://your-student-app.vercel.app)
- [ ] Loads without console errors
- [ ] Images load correctly
- [ ] Navigation works
- [ ] Registration flow completes
- [ ] Login successful
- [ ] Can browse hostels
- [ ] Booking submission works
- [ ] Real-time updates work (if applicable)

### Owner App (https://your-owner-app.vercel.app)
- [ ] Loads without errors
- [ ] Owner authentication works
- [ ] Dashboard displays correctly

### Admin App (https://your-admin-app.vercel.app)
- [ ] Super admin can log in
- [ ] All dashboard sections accessible
- [ ] Can manage users
- [ ] Can manage hostels
- [ ] Can view payments
- [ ] CRUD operations work
- [ ] No permission errors

### Cross-App Testing
- [ ] Logout works on all apps
- [ ] Session persists across refreshes
- [ ] Role-based routing works
- [ ] Protected routes redirect correctly

---

## 🔒 Security Audit

- [ ] No sensitive data in client-side code
- [ ] API keys are environment variables only
- [ ] RLS policies prevent unauthorized access
- [ ] Authentication required for protected routes
- [ ] Input validation on forms
- [ ] XSS protection in place
- [ ] CSRF protection enabled

---

## 📊 Monitoring Setup (Recommended)

- [ ] Error tracking configured (Sentry, LogRocket)
- [ ] Analytics setup (Google Analytics, Plausible)
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured (UptimeRobot)
- [ ] Database backup strategy in place

---

## 🎨 Final Checks

### User Experience
- [ ] Professional appearance maintained
- [ ] December mood/winter theme appropriate (per user preference)
- [ ] Mobile responsive design tested
- [ ] Loading states display correctly
- [ ] Error messages are helpful
- [ ] Forms have proper validation feedback

### Performance
- [ ] Page load time < 3 seconds
- [ ] Images optimized
- [ ] Code splitting working
- [ ] No unnecessary re-renders
- [ ] Lighthouse score > 90

### Accessibility
- [ ] Keyboard navigation works
- [ ] Alt text on images
- [ ] Proper heading hierarchy
- [ ] Color contrast adequate
- [ ] Focus indicators visible

---

## 📝 Documentation

- [ ] README.md updated
- [ ] DEPLOYMENT.md reviewed
- [ ] DATABASE_SETUP.md followed
- [ ] Team members informed of deployment
- [ ] Support contacts identified

---

## 🆘 Rollback Plan

In case of issues:
- [ ] Know how to rollback: `vercel rollback [DEPLOYMENT_ID]`
- [ ] Previous stable version identified
- [ ] Database backup available
- [ ] Communication plan ready

---

## ✨ Go Live!

Once all items checked:
- [ ] Update DNS records (if using custom domain)
- [ ] Announce launch to stakeholders
- [ ] Monitor error logs for first 24 hours
- [ ] Collect user feedback
- [ ] Schedule post-launch review

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Version**: 1.0.0  

**Notes**:
_______________________________________
_______________________________________
_______________________________________
