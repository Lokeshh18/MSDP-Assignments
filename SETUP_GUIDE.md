# CampusHub - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun runtime
- A Supabase project (free tier works)

### 1. Install Dependencies

```bash
npm install
# or
bun install
```

### 2. Configure Supabase

#### A. Set up Environment Variables
Your `.env` file should contain:
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"
```

#### B. Run the Database Migration

**IMPORTANT**: This step is required for authentication and the 3-tier role system to work.

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase/migrations/20260401_complete_3tier_system.sql`
4. Paste and run it in the SQL Editor
5. Verify all tables and policies are created successfully

The migration will:
- ✅ Create the 3-tier role system (student, club_admin, admin)
- ✅ Set up all required tables (profiles, user_roles, clubs, events, registrations, approval_history)
- ✅ Configure Row Level Security (RLS) policies
- ✅ Create automatic role assignment on signup
- ✅ Set `lokeshhofficial18@gmail.com` as Campus Hub Admin

### 3. Start the Development Server

```bash
npm run dev
# or
bun run dev
```

The app will run at `http://localhost:8080`

---

## 👥 3-Tier Role System

### Role Assignment

| Role | How to Get | Dashboard | Permissions |
|------|-----------|-----------|-------------|
| **Campus Hub Admin** | Email: `lokeshhofficial18@gmail.com` | `/campus-hub-admin` | Approve/reject clubs & events, manage all content |
| **Club Admin** | Email contains "admin" or "club" (e.g., `clubadmin@test.com`) | `/club-admin-dashboard` | Create/manage own clubs & events |
| **Student** | Any other email | `/dashboard` | Browse events, create clubs, register for events |

### Role-Based Dashboards

#### 1. Campus Hub Admin Dashboard (`/campus-hub-admin`)
- View pending clubs and events
- Approve/Reject clubs
- Approve/Reject events
- View approved items
- Full system oversight

#### 2. Club Admin Dashboard (`/club-admin-dashboard`)
- Create new clubs
- View own clubs (with status)
- Create events for clubs
- Manage own events
- Track approval status

#### 3. Student Dashboard (`/dashboard`)
- View event registrations
- Register for events
- Create clubs (pending approval)
- Create events (pending approval)

---

## 🔐 Authentication Flow

### Sign Up
1. User registers with email/password
2. Automatic profile creation
3. Role assigned based on email:
   - `lokeshhofficial18@gmail.com` → **admin**
   - Contains "admin"/"club" → **club_admin**
   - All others → **student**

### Sign In
1. User enters credentials
2. Supabase authenticates
3. Role fetched from database
4. Redirected to appropriate dashboard

### Email Confirmation
By default, email confirmation is **disabled** for development. To enable:
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Email provider
3. Configure email templates

---

## 📋 Testing the System

### Test Account Creation

#### 1. Create Campus Hub Admin
- Email: `lokeshhofficial18@gmail.com`
- Password: Any (6+ characters)
- Dashboard: `/campus-hub-admin`

#### 2. Create Club Admin
- Email: `clubadmin@test.com` (must contain "admin" or "club")
- Password: Any
- Dashboard: `/club-admin-dashboard`

#### 3. Create Student
- Email: `student@test.com`
- Password: Any
- Dashboard: `/dashboard`

### Test Workflow

1. **As Student**:
   - Register account
   - Create a club → Status: "pending"
   - Club appears in dashboard

2. **As Campus Hub Admin**:
   - Login as `lokeshhofficial18@gmail.com`
   - Go to `/campus-hub-admin`
   - See pending club
   - Click "Approve"

3. **As Club Admin**:
   - Login with club admin account
   - Go to `/club-admin-dashboard`
   - Club now shows "approved"
   - Create event for approved club
   - Event status: "pending"

4. **As Campus Hub Admin**:
   - Approve the event
   - Event now visible on `/events` page

---

## 🗄️ Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with name/email |
| `user_roles` | Role assignments (student/club_admin/admin) |
| `clubs` | Club records with approval status |
| `events` | Event records linked to clubs |
| `registrations` | Student event registrations |
| `approval_history` | Audit trail for approvals |

### Approval Status Flow

```
Created → Pending → [Admin Review] → Approved/Rejected
```

---

## 🛠️ Troubleshooting

### Login Shows "Invalid Credentials"

**Possible causes:**
1. User doesn't exist in Supabase Auth
2. Email confirmation required but not completed
3. Wrong password

**Solutions:**
1. Check Supabase Dashboard → Authentication → Users
2. Verify user exists
3. Reset password if needed
4. Check email confirmation settings

### Role Not Assigned Correctly

**Check:**
1. Migration was run successfully
2. Trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created'`
3. Function exists: `SELECT * FROM pg_proc WHERE proname = 'create_user_profile_and_role'`

**Fix:**
Re-run the migration SQL file

### Can't Access Dashboard

**Check:**
1. User is logged in
2. Role is correctly assigned in `user_roles` table
3. RLS policies allow access

**Debug:**
```sql
-- Check user's role
SELECT * FROM user_roles WHERE user_id = 'your-user-id';

-- Check profile
SELECT * FROM profiles WHERE user_id = 'your-user-id';
```

### Events/Clubs Not Visible

**Check:**
1. Status is "approved" (only approved items are public)
2. RLS policies are correct
3. User has permission to view

---

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── Navbar.tsx       # Navigation with role-based links
│   ├── ProtectedRoute.tsx # Role-based route protection
│   └── EventCard.tsx
├── contexts/
│   └── AuthContext.tsx  # Auth state + role management
├── pages/
│   ├── Index.tsx                    # Landing page
│   ├── Login.tsx                    # Sign in
│   ├── Register.tsx                 # Sign up
│   ├── Events.tsx                   # Public events
│   ├── EventDetails.tsx             # Event details
│   ├── StudentDashboard.tsx         # Student dashboard
│   ├── ClubAdminDashboard.tsx       # Club admin dashboard
│   ├── CampusHubAdminDashboard.tsx  # Campus admin dashboard
│   ├── AdminDashboard.tsx           # Legacy admin panel
│   ├── CreateClub.tsx               # Club creation
│   ├── CreateEvent.tsx              # Event creation
│   └── EditEvent.tsx                # Event editing
└── App.tsx                          # Routes configuration
```

---

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build

# Testing
npm run test         # Run Vitest tests
npm run test:watch   # Watch mode

# Code Quality
npm run lint         # ESLint
```

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm run preview
```

### Environment Variables for Production

Ensure these are set in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Recommended Hosting
- **Vercel** - Automatic deployments from Git
- **Netlify** - Simple drag-and-drop
- **Cloudflare Pages** - Fast global CDN

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review Supabase Dashboard logs
3. Check browser console for errors
4. Verify database migration was successful

---

## ✅ Checklist

Before going live, ensure:

- [ ] Database migration executed
- [ ] Environment variables configured
- [ ] Test all 3 roles work correctly
- [ ] Email confirmation configured (if needed)
- [ ] RLS policies tested
- [ ] Build completes without errors
- [ ] All dashboards accessible by correct roles

---

**Built with ❤️ for campus communities**
