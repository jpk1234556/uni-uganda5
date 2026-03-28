# 🚀 Quick Deploy Script for Uni-Nest

This script helps you deploy all three apps to Vercel.

## Prerequisites

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

## Deploy All Apps

### Option 1: Interactive Deployment

```bash
# Deploy student app
cd apps/student
vercel --prod

# Deploy owner app  
cd ../owner
vercel --prod

# Deploy admin app
cd ../admin
vercel --prod
```

### Option 2: Automated Deployment

Create a `deploy.sh` script (Linux/Mac):

```bash
#!/bin/bash

echo "🚀 Deploying Uni-Nest Platform..."

# Deploy Student App
echo "📚 Deploying Student App..."
cd apps/student
vercel --prod
cd ../..

# Deploy Owner App
echo "🏠 Deploying Owner App..."
cd apps/owner
vercel --prod
cd ../..

# Deploy Admin App
echo "👨‍💼 Deploying Admin App..."
cd apps/admin
vercel --prod
cd ../..

echo "✅ All apps deployed successfully!"
```

Make it executable and run:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 3: PowerShell Script (Windows)

Create `deploy.ps1`:

```powershell
Write-Host "🚀 Deploying Uni-Nest Platform..." -ForegroundColor Cyan

# Deploy Student App
Write-Host "`n📚 Deploying Student App..." -ForegroundColor Green
Set-Location apps/student
vercel --prod
Set-Location ../..

# Deploy Owner App
Write-Host "`n🏠 Deploying Owner App..." -ForegroundColor Green
Set-Location apps/owner
vercel --prod
Set-Location ../..

# Deploy Admin App
Write-Host "`n👨‍💼 Deploying Admin App..." -ForegroundColor Green
Set-Location apps/admin
vercel --prod
Set-Location ../..

Write-Host "`n✅ All apps deployed successfully!" -ForegroundColor Cyan
```

Run in PowerShell:
```powershell
.\deploy.ps1
```

---

## Set Environment Variables on Vercel

After deploying, set environment variables for each app:

### Via Vercel Dashboard

1. Go to project settings on Vercel
2. Navigate to "Environment Variables"
3. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Redeploy to apply changes

### Via Vercel CLI

```bash
# Student App
cd apps/student
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel --prod

# Owner App
cd ../owner
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel --prod

# Admin App
cd ../admin
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel --prod
```

---

## Custom Domains (Optional)

Set up custom domains for each app:

```bash
# Student App
cd apps/student
vercel domains add student.uninest.ug

# Owner App
cd ../owner
vercel domains add owner.uninest.ug

# Admin App
cd ../admin
vercel domains add admin.uninest.ug
```

---

## Verify Deployment

After deployment, test each app:

1. **Student App**: https://your-student-app.vercel.app
   - [ ] Homepage loads
   - [ ] Can browse hostels
   - [ ] Registration works
   - [ ] Login works

2. **Owner App**: https://your-owner-app.vercel.app
   - [ ] Dashboard accessible
   - [ ] Can view properties

3. **Admin App**: https://your-admin-app.vercel.app
   - [ ] Super admin can log in
   - [ ] All admin features work

---

## Rollback (If Needed)

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [DEPLOYMENT_ID]
```

---

**Note**: Make sure your Supabase credentials are correct before deploying!
