# 🔍 Login Debugging Guide

## Issue: Login succeeds but page keeps loading

### What Was Fixed

1. **AuthContext Loading State**: Fixed race condition where `setLoading(false)` was called before role was fully set
2. **Login Navigation**: Changed to use `useEffect` that watches auth state changes instead of immediate navigation
3. **Role Fetching**: Ensured role is fetched and set before navigation occurs

### How to Debug

#### 1. Check Browser Console

After logging in, you should see these console logs in order:

```
Auth state changed event: SIGNED_IN
Fetching role for user: lokeshhofficial18@gmail.com
User role fetched: admin
Auth loading complete, loading set to false
User logged in, redirecting based on role
isCampusHubAdmin: true
isClubAdmin: false
isStudent: false
Navbar Auth State: { user: 'lokeshhofficial18@gmail.com', role: 'admin', ... }
```

#### 2. Verify User Role in Database

Run this in Supabase SQL Editor:

```sql
SELECT 
  au.email,
  ur.role,
  ur.created_at
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE au.email = 'lokeshhofficial18@gmail.com';
```

Expected result:
```
email                        | role | created_at
lokeshhofficial18@gmail.com  | admin| 2026-03-31...
```

#### 3. If Role is NULL or Missing

Run the fix script: `supabase/migrations/fix_admin_role.sql`

Or manually:

```sql
-- Delete old roles
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'lokeshhofficial18@gmail.com');

-- Insert admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'lokeshhofficial18@gmail.com';
```

#### 4. If Trigger is Not Working

Check if trigger exists:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

If missing, re-run the main migration: `supabase/migrations/20260401_complete_3tier_system.sql`

### Expected Flow

1. User enters credentials → Clicks "Sign In"
2. `signIn()` calls Supabase auth
3. `onAuthStateChange` event fires with `SIGNED_IN`
4. `handleSession()` fetches user role from database
5. Role is set in state (`admin`, `club_admin`, or `student`)
6. `loading` is set to `false`
7. Login page's `useEffect` detects role change
8. Navigation happens based on role:
   - Admin → `/campus-hub-admin`
   - Club Admin → `/club-admin-dashboard`
   - Student → `/dashboard`

### Common Issues

#### Issue 1: Role is NULL after login
**Cause**: Database migration not run or trigger not working
**Fix**: Run `supabase/migrations/20260401_complete_3tier_system.sql`

#### Issue 2: Loading never completes
**Cause**: `fetchRole` failing silently
**Fix**: Check console for "Error fetching role from DB" message

#### Issue 3: Redirects to wrong dashboard
**Cause**: Role assigned incorrectly
**Fix**: Check and update role in `user_roles` table

#### Issue 4: "Invalid credentials" but user exists
**Cause**: Email confirmation required
**Fix**: Disable email confirmation in Supabase Dashboard

### Quick Test

1. Open browser console (F12)
2. Go to `/login`
3. Enter credentials
4. Click "Sign In"
5. Watch console logs

If you don't see "User role fetched: [role]" within 2 seconds, the issue is with the database query.

### Manual Role Assignment

If automatic role assignment isn't working, manually assign roles:

```sql
-- For Campus Hub Admin
UPDATE public.user_roles 
SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'lokeshhofficial18@gmail.com');

-- For Club Admin (replace email)
UPDATE public.user_roles 
SET role = 'club_admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');

-- For Student (replace email)
UPDATE public.user_roles 
SET role = 'student'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

### Verify Everything Works

After fixing, test all 3 roles:

1. **Admin Login**: `lokeshhofficial18@gmail.com`
   - Should redirect to `/campus-hub-admin`
   - Should see "Admin Panel" in navbar

2. **Club Admin Login**: Any email with "admin" or "club"
   - Should redirect to `/club-admin-dashboard`
   - Should see "Club Dashboard" in navbar

3. **Student Login**: Any other email
   - Should redirect to `/dashboard`
   - Should see "Dashboard" in navbar

### Still Having Issues?

1. Clear browser cache and localStorage
2. Check Supabase dashboard logs
3. Verify `.env` has correct Supabase credentials
4. Ensure RLS policies allow reading `user_roles` table
