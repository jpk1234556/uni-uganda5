# 🏠 Uni-Nest - University Hostel Booking Platform

A comprehensive monorepo-based platform for university student hostel booking in Uganda.

![Status](https://img.shields.io/badge/status-production--ready-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)

---

## 📚 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## ✨ Features

### For Students

- 🔍 Browse and search approved hostels
- 📍 Filter by location, price, and amenities
- 📸 View detailed property information with images
- ⭐ Read reviews and ratings from other students
- 📝 Submit booking requests online
- 💳 Track payment status
- 👥 Find roommates

### For Hostel Owners

- 🏢 Manage property listings
- 📊 View and manage bookings
- 💰 Track payments and revenue
- ✅ Approve/reject booking requests
- 📈 Analytics dashboard

### For Administrators

- 👥 User management (suspend/activate)
- 🏠 Complete control over hostel listings
- 🔐 Verify and approve properties
- 💵 Payment oversight and platform fees
- 📊 Comprehensive reports and analytics
- ⚡ Real-time updates across all apps

---

## 🛠️ Tech Stack

**Frontend:**

- React 19.2 with TypeScript
- Vite 7.3.1 (Build tool & dev server)
- Tailwind CSS 4.2.1 (Styling)
- Radix UI (UI components)
- React Router DOM 7.13.1 (Routing)
- Framer Motion (Animations)

**Backend:**

- Supabase (PostgreSQL + Auth + Realtime)
- Row Level Security (RLS)
- Real-time subscriptions

**State Management:**

- Context API
- React Hook Forms
- Zod validation

**Monorepo:**

- npm workspaces
- Shared packages for types, contexts, and UI

---

## 📁 Project Structure

```
uni-nest1/
├── apps/                    # Three separate applications
│   ├── student/            # Student-facing app
│   │   ├── src/
│   │   ├── pages/
│   │   └── dist/           # Production build
│   ├── owner/              # Hostel owner dashboard
│   │   ├── src/
│   │   └── dist/
│   └── admin/              # Super admin panel
│       ├── src/
│       └── dist/
├── packages/               # Shared code
│   ├── shared/            # Types, contexts, utilities
│   └── ui/                # Reusable UI components
├── supabase/              # Database migrations
│   └── *.sql
├── .env.local             # Environment variables (gitignored)
├── DEPLOYMENT.md          # Deployment guide
└── DATABASE_SETUP.md      # Database setup guide
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd uni-nest1

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local and add your Supabase credentials
# VITE_SUPABASE_URL=your_url
# VITE_SUPABASE_ANON_KEY=your_key
```

### Run Development Servers

```bash
# Student app (port determined by Vite)
npm run dev:student

# Owner app
npm run dev:owner

# Admin app
npm run dev:admin
```

Each app will be available at a local URL shown in the terminal.

---

## 📖 Documentation

### Getting Started Guides

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete production deployment guide
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Database configuration and migrations
- **[DEPLOY_SCRIPT.md](./DEPLOY_SCRIPT.md)** - Quick deploy scripts for Vercel

### Key Resources

1. **Database Setup**: Run all SQL migrations in Supabase
2. **Environment Variables**: Configure `.env.local` with Supabase credentials
3. **Build**: Test with `npm run build:all`
4. **Deploy**: Follow DEPLOYMENT.md for production deployment

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

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

**Important**: Set environment variables on Vercel for each deployed app:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Monorepo Root Vercel Presets

This repository includes root-level Vercel preset files:

- `vercel.student.json`
- `vercel.owner.json`
- `vercel.admin.json`

You can deploy from root with a specific preset using Vercel CLI:

```bash
vercel --prod --local-config vercel.student.json
vercel --prod --local-config vercel.owner.json
vercel --prod --local-config vercel.admin.json
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Other Platforms

The apps can be deployed to any static hosting:

- Netlify
- Cloudflare Pages
- AWS Amplify
- Railway

---

## 🔧 Available Scripts

```bash
# Development
npm run dev:student    # Start student app dev server
npm run dev:owner      # Start owner app dev server
npm run dev:admin      # Start admin app dev server

# Build
npm run build         # Build all apps
npm run build:all     # Same as above

# Linting
npm run lint          # Run ESLint

# Preview production builds
npm run preview       # Preview built apps
```

---

## 👥 User Roles

### Student

Browse hostels, submit bookings, track payments, find roommates

### Hostel Owner

Manage properties, view bookings, receive payments

### Super Admin

Full platform control - user management, property approval, financial oversight

---

## 🗄️ Database Setup

1. Create Supabase project
2. Run all SQL migrations in order (see `supabase/` folder)
3. Create initial super admin user
4. Enable Row Level Security (RLS)
5. Configure realtime subscriptions

Detailed steps in [DATABASE_SETUP.md](./DATABASE_SETUP.md)

---

## 🔐 Security

- Row Level Security (RLS) on all database tables
- Role-based access control
- Protected routes in frontend
- Client-side and server-side validation
- Secure authentication via Supabase Auth

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 🆘 Support

If you encounter issues:

1. Check the [troubleshooting section](./DEPLOYMENT.md#troubleshooting)
2. Review browser console for errors
3. Verify environment variables are set correctly
4. Check Supabase dashboard for database errors

---

## 🎯 Roadmap

- [ ] Mobile app versions (React Native)
- [ ] In-app messaging system
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Integration with university systems
- [ ] Automated backup system

---

**Built with ❤️ for Ugandan university students**

_Last Updated: March 2026_
