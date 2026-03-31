# College Connect - Project Context

## Project Overview

**College Connect** (branded as **CampusHub**) is a full-stack web application built as a centralized portal for campus event management and club activities. It implements a **3-tier approval system** with role-based access control.

### Core Features

- **Event Management**: Browse, create, and register for campus events
- **Club System**: Create and manage student clubs with approval workflows
- **3-Tier User Roles**:
  - **Student**: Browse events, create clubs, create events (pending approval)
  - **Club Admin**: Manage club events and registrations
  - **CampusHub Admin**: Approve/reject clubs and events (exclusive to `lokeshhofficial18@gmail.com`)
- **Approval Workflow**: Clubs and events require admin approval before becoming visible
- **Authentication**: Supabase Auth with automatic role assignment

### Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18.3, TypeScript 5.8 |
| **Build Tool** | Vite 5.4 |
| **Routing** | React Router 6.30 |
| **Backend** | Supabase (PostgreSQL + Auth) |
| **State Management** | TanStack React Query 5.83 |
| **UI Framework** | shadcn/ui (Radix UI primitives) |
| **Styling** | Tailwind CSS 3.4 |
| **Forms** | React Hook Form 7.61 + Zod validation |
| **Testing** | Vitest + Playwright |

---

## Project Structure

```
college-connect-main/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── EventCard.tsx
│   │   ├── Navbar.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── NavLink.tsx
│   ├── contexts/            # React Context providers
│   │   └── AuthContext.tsx  # Auth state + role management
│   ├── hooks/               # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── integrations/        # External service integrations
│   │   └── supabase/
│   │       ├── client.ts    # Supabase client instance
│   │       └── types.ts     # Generated TypeScript types
│   ├── lib/                 # Utility libraries
│   ├── pages/               # Route page components
│   │   ├── Index.tsx        # Landing page
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Events.tsx       # Event listing
│   │   ├── EventDetails.tsx
│   │   ├── StudentDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── CampusHubAdminDashboard.tsx  # Admin approval panel
│   │   ├── CreateClub.tsx
│   │   ├── CreateEvent.tsx
│   │   ├── EditEvent.tsx
│   │   └── NotFound.tsx
│   ├── App.tsx              # Main app with routes
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── supabase/
│   ├── migrations/          # Database migrations
│   │   ├── 20260331045130_*.sql  # Initial schema
│   │   └── 20260331_add_3tier_approval_system.sql
│   └── config.toml
├── public/                  # Static assets
├── .env                     # Environment variables
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── playwright.config.ts
```

---

## Building and Running

### Prerequisites

- **Node.js** 18+ or **Bun** runtime
- **Supabase project** configured (see `.env` for credentials)

### Installation

```bash
# Using npm
npm install

# Using Bun
bun install
```

### Development Server

```bash
# Start dev server (Vite)
npm run dev
# or
bun run dev

# Server runs at http://localhost:8080
```

### Build Commands

```bash
# Production build
npm run build

# Development build
npm run build:dev

# Preview production build
npm run preview
```

### Testing

```bash
# Run unit tests (Vitest)
npm run test

# Watch mode
npm run test:watch

# Run E2E tests (Playwright)
npx playwright test
```

### Linting

```bash
npm run lint
```

---

## Environment Variables

Required variables in `.env`:

```env
VITE_SUPABASE_URL="https://<project-id>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<your-anon-key>"
VITE_SUPABASE_PROJECT_ID="<project-id>"
```

---

## Database Schema

### Key Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with name/email |
| `user_roles` | Role assignments (`student`, `club_admin`, `admin`) |
| `clubs` | Club records with approval status |
| `events` | Event records linked to clubs |
| `approval_history` | Audit trail for approvals |
| `event_registrations` | Student event registrations |

### Approval Status Values

- `pending` - Awaiting admin review
- `approved` - Visible to all users
- `rejected` - Hidden from public view

### Special Admin Account

The email `lokeshhofficial18@gmail.com` is automatically assigned the `admin` role on signup, granting access to the CampusHub Admin Dashboard.

---

## Development Conventions

### Code Style

- **TypeScript**: Strict mode disabled for flexibility (see `tsconfig.json`)
- **Path Aliases**: Use `@/` for `src/` imports
- **Component Naming**: PascalCase for components, camelCase for utilities
- **File Extensions**: `.tsx` for React components, `.ts` for utilities

### Component Patterns

```tsx
// Functional components with typed props
interface ComponentProps {
  prop: string;
}

export default function Component({ prop }: ComponentProps) {
  return <div>{prop}</div>;
}
```

### State Management

- Use **React Query** for server state (data fetching, caching)
- Use **Context API** for global UI state (auth, theme)
- Avoid prop drilling with context for shared state

### Testing Practices

- **Unit Tests**: Vitest with React Testing Library
- **E2E Tests**: Playwright for critical user flows
- Test files: `*.test.ts` or `*.spec.ts` in `src/` directory

### Git Workflow

- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Commit messages: Conventional Commits format

---

## Key Workflows

### Student Registration Flow

1. User registers via `/register`
2. Trigger creates `profiles` entry + assigns `student` role
3. User can browse events, create clubs, create events
4. Created items start as `pending`

### Club Creation Flow

1. Student/Club Admin fills Create Club form
2. Club saved with `status: 'pending'`
3. CampusHub Admin reviews at `/campus-hub-admin`
4. On approval → `status: 'approved'` → visible to all

### Event Creation Flow

1. User selects approved club from dropdown
2. Event saved with `status: 'pending'` + `club_id`
3. CampusHub Admin approves/rejects
4. Approved events appear on `/events` page

---

## Routes Reference

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Login form |
| `/register` | Public | Registration form |
| `/events` | Public | Event listing (approved only) |
| `/events/:id` | Public | Event details |
| `/dashboard` | Student, Club Admin | User dashboard |
| `/create-club` | Student, Club Admin | Club creation form |
| `/admin/create-event` | Student, Club Admin | Event creation form |
| `/admin/edit-event/:id` | Student, Club Admin | Event editing |
| `/campus-hub-admin` | CampusHub Admin only | Approval dashboard |
| `/admin` | Admin | Legacy admin panel |

---

## UI Component Library

This project uses **shadcn/ui** components built on Radix UI primitives:

- `Button`, `Input`, `Label`, `Card`
- `Dialog`, `AlertDialog`, `Popover`
- `Select`, `Dropdown Menu`, `Tabs`
- `Toast`, `Sonner` (notifications)
- `Tooltip`, `Collapsible`, `ScrollArea`

Components located in `src/components/ui/`.

---

## Known Configuration

### Vite Config

- Port: `8080`
- HMR overlay: disabled
- Path alias: `@` → `./src`

### Tailwind Config

- Extended with custom colors, fonts
- Animations via `tailwindcss-animate`
- Typography plugin enabled

### TypeScript Config

- Path aliases configured
- Strict mode: disabled
- Skip lib check: enabled

---

## Common Tasks

### Adding a New Route

1. Create page component in `src/pages/`
2. Import in `App.tsx`
3. Add `<Route>` with appropriate `ProtectedRoute` wrapper
4. Update `Navbar.tsx` if navigation link needed

### Adding Database Columns

1. Create migration in `supabase/migrations/`
2. Update types in `src/integrations/supabase/types.ts`
3. Run migration in Supabase SQL Editor

### Modifying Auth Behavior

Edit `src/contexts/AuthContext.tsx`:
- Role fetching logic
- Session management
- Custom signup/signin handlers

---

## Troubleshooting

### Auth Issues

- Check `.env` has correct Supabase credentials
- Verify RLS policies in Supabase dashboard
- Clear localStorage if session stuck

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

### Type Errors

- Regenerate Supabase types if schema changed
- Check `src/integrations/supabase/types.ts` is up to date

---

## External Resources

- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [React Router Docs](https://reactrouter.com)
- [TanStack Query Docs](https://tanstack.com/query)
