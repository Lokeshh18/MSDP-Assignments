# CampusHub - College Event Management Platform

> A centralized hub for campus events with a 3-tier approval system

![Status](https://img.shields.io/badge/status-ready-success)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 Features

- **3-Tier Role System**: Campus Hub Admin, Club Admin, Student
- **Event Management**: Create, browse, and register for campus events
- **Club System**: Create and manage student clubs
- **Approval Workflow**: Admin approval for clubs and events
- **Role-Based Dashboards**: Custom interface for each user role
- **Responsive Design**: Works on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Supabase account (free tier)

### Installation

```bash
# Install dependencies
npm install

# Configure .env with your Supabase credentials
# Run database migration in Supabase SQL Editor

# Start development server
npm run dev
```

Server runs at: **http://localhost:8080**

## 👥 User Roles

| Role | Email Pattern | Dashboard | Permissions |
|------|--------------|-----------|-------------|
| **Campus Hub Admin** | `lokeshhofficial18@gmail.com` | `/campus-hub-admin` | Full system access, approve/reject items |
| **Club Admin** | Contains "admin" or "club" | `/club-admin-dashboard` | Manage own clubs & events |
| **Student** | Any other email | `/dashboard` | Browse, register, create (pending approval) |

## 📁 Project Structure

```
college-connect-main/
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React Context (Auth, etc.)
│   ├── pages/           # Route pages
│   ├── hooks/           # Custom hooks
│   └── integrations/    # Supabase integration
├── supabase/
│   └── migrations/      # Database migrations
├── public/              # Static assets
└── package.json
```

## 🗄️ Database Setup

**IMPORTANT**: Run the database migration before using the app:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the migration SQL from `supabase/migrations/`
3. Run in SQL Editor

## 🧪 Testing

### Create Test Accounts

```
Campus Admin:  lokeshhofficial18@gmail.com / Test123!
Club Admin:    clubadmin@test.com / Test123!
Student:       student@test.com / Test123!
```

### Test Workflow

1. Register as student → Create club (pending)
2. Login as admin → Approve club
3. Login as club admin → Create event (pending)
4. Login as admin → Approve event
5. Event visible to all users

## 🛠️ Development

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview build

# Testing
npm run test         # Run tests
npm run lint         # Lint code
```

## 🔧 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **UI**: shadcn/ui, Tailwind CSS
- **State**: TanStack React Query
- **Routing**: React Router v6

## 📄 License

MIT License

---

**Built with ❤️ for campus communities**
