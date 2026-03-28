# 🚀 Quick Start Guide - Deploy in 30 Minutes

Get Uni-Nest deployed to production in under 30 minutes!

---

## ⏱️ Timeline

- **Minutes 1-5**: Supabase setup
- **Minutes 6-15**: Database configuration  
- **Minutes 16-20**: Local build test
- **Minutes 21-30**: Deploy to Vercel

---

## 📋 Prerequisites

- Node.js 18+ installed
- npm installed
- GitHub account
- Vercel account (free tier works)
- Supabase account (free tier works)

---

## Step-by-Step Guide

### Minutes 1-5: Supabase Setup ⚙️

1. **Create Supabase Project**
   ```
   → Go to https://app.supabase.com
   → Click "New Project"
   → Choose organization
   → Name: "Uni-Nest"
   → Database password: (save this!)
   → Region: Choose closest to you
   → Create project (takes ~2 minutes)
   ```

2. **Get Credentials**
   ```
   → Go to Settings → API
   → Copy "Project URL"
   → Copy "anon/public key"
   → Save these for next step
   ```

---

### Minutes 6-15: Database Configuration 🗄️

3. **Update Environment File**
   
   Open `.env.local` in root and paste:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbG...your-key-here
   ```

4. **Run Database Migrations**
   
   In Supabase Dashboard:
   ```
   → Go to SQL Editor
   → Click "New Query"
   → Open supabase/complete_migration.sql
   → Copy entire contents
   → Paste into SQL Editor
   → Click "Run"
   → Wait for success message
   ```

5. **Run Phase Migrations** (Optional but recommended)
   
   Repeat step 4 for each file in order:
   - `phase6_auth_trigger.sql` ⚠️ REQUIRED
   - `phase10_admin_monopoly.sql` ⚠️ REQUIRED
   - `phase13_realtime.sql` ⚠️ REQUIRED
   - All other phase*.sql files

6. **Create Super Admin**
   
   Run this SQL:
   ```sql
   -- Find your user after signing up via the app
   -- OR create directly:
   INSERT INTO users (id, email, first_name, last_name, role, is_active) 
   VALUES (gen_random_uuid(), 'admin@uninest.ug', 'Super', 'Admin', 'super_admin', true);
   ```

---

### Minutes 16-20: Local Build Test 💻

7. **Install Dependencies**
   ```bash
   npm install
   ```

8. **Build All Apps**
   ```bash
   npm run build:all
   ```

9. **Verify Builds**
   ```bash
   # Check these folders exist:
   ls apps/student/dist
   ls apps/owner/dist
   ls apps/admin/dist
   ```

   ✅ If all three exist, builds succeeded!

---

### Minutes 21-30: Deploy to Vercel 🌐

10. **Install Vercel CLI**
    ```bash
    npm install -g vercel
    ```

11. **Login to Vercel**
    ```bash
    vercel login
    ```

12. **Deploy Student App**
    ```bash
    cd apps/student
    vercel --prod
    ```
    
    When prompted:
    - Set Root Directory: Leave blank (already configured)
    - Override Build Command: Leave blank
    - Override Output Directory: Leave blank
    
    ✅ Wait for deployment (~2 minutes)
    ✅ Copy the URL provided

13. **Deploy Owner App**
    ```bash
    cd ../owner
    vercel --prod
    ```
    ✅ Copy the URL

14. **Deploy Admin App**
    ```bash
    cd ../admin
    vercel --prod
    ```
    ✅ Copy the URL

---

### Post-Deployment (Critical!) 🔧

15. **Set Environment Variables on Vercel**

    For EACH of the 3 deployed apps:
    
    ```
    → Go to Vercel dashboard
    → Select the project
    → Settings → Environment Variables
    → Add Variable:
       Key: VITE_SUPABASE_URL
       Value: your-supabase-url
       Environment: Production ✓
    → Add Variable:
       Key: VITE_SUPABASE_ANON_KEY
       Value: your-anon-key
       Environment: Production ✓
    → Save changes
    ```

16. **Redeploy Each App**
    
    After adding env vars, redeploy:
    ```bash
    # Redeploy student app
    cd apps/student
    vercel --prod
    
    # Redeploy owner app
    cd ../owner
    vercel --prod
    
    # Redeploy admin app
    cd ../admin
    vercel --prod
    ```

---

## ✅ Verify Deployment

Visit each deployed URL and test:

### Student App
- [ ] Homepage loads
- [ ] Can browse hostels
- [ ] Click "Register"
- [ ] Create test account
- [ ] Verify email (if enabled)
- [ ] Login works

### Admin App
- [ ] Navigate to admin URL
- [ ] Login with super admin
- [ ] Dashboard shows metrics
- [ ] Can access all sections

---

## 🎉 You're Live!

Congratulations! Your platform is now live at:
- Student App: `https://your-student-app.vercel.app`
- Owner App: `https://your-owner-app.vercel.app`
- Admin App: `https://your-admin-app.vercel.app`

---

## 🆘 Troubleshooting

### "Build failed" error
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build:all
```

### "Supabase not configured" error
→ Check .env.local has correct values  
→ Verify environment variables set on Vercel  
→ Redeploy after adding env vars

### "Permission denied" in admin app
→ Verify user has `super_admin` role in database  
→ Check RLS policies are active  
→ Re-run phase6_auth_trigger.sql

### Can't access admin dashboard
→ Make sure you're using super_admin account  
→ Clear browser cache  
→ Check allowedRoles is ['super_admin'] not ['admin']

---

## 📞 Need Help?

1. Check DEPLOYMENT.md for detailed guide
2. Review DATABASE_SETUP.md for database issues
3. Check PRODUCTION_CHECKLIST.md for comprehensive list
4. Examine browser console for errors
5. Review Vercel deployment logs

---

## 🎯 Next Steps

After successful deployment:

1. **Custom Domain** (Optional)
   ```bash
   vercel domains add uninest-student.com
   ```

2. **Add Monitoring** (Recommended)
   - Sentry for error tracking
   - Google Analytics for usage
   - UptimeRobot for monitoring

3. **Setup CI/CD** (Optional)
   - Connect GitHub to Vercel
   - Automatic deployments on push

4. **Backup Strategy**
   - Enable Supabase daily backups
   - Export database regularly

---

**Time Elapsed**: ~30 minutes  
**Status**: Production Live ✅  

**You did it!** 🎉
