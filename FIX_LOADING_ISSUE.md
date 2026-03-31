# 🔧 CRITICAL FIX - Dashboard Stuck Loading

## Problem
- Login succeeds
- Database shows correct role (`admin`)
- But dashboard keeps loading forever
- Signout button doesn't work

## Root Cause
The `user_roles` table query is **hanging** due to RLS (Row Level Security) policies blocking the query, even though the user is authenticated.

## Solution - Run This SQL

**Copy and run this ENTIRE script** in Supabase SQL Editor:

```sql
-- =====================================================
-- FIX USER_ROLES RLS POLICIES
-- =====================================================

-- 1. First, let's see what policies exist
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_roles';

-- 2. Drop ALL existing policies on user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for own role" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for admins" ON public.user_roles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_roles;
DROP POLICY IF EXISTS "Enable admin full access" ON public.user_roles;

-- 3. Create NEW simple policies

-- Allow authenticated users to read their OWN role
CREATE POLICY "user_roles_read_own"
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow authenticated users to read ALL roles (needed for admin dashboard)
CREATE POLICY "user_roles_read_all"
  ON public.user_roles 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow insert only for the user themselves (trigger creates initial role)
CREATE POLICY "user_roles_insert_own"
  ON public.user_roles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own role
CREATE POLICY "user_roles_update_own"
  ON public.user_roles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- 4. Verify the policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_roles';

-- 5. Test the query manually
-- This should return 'admin'
SELECT role FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'lokeshhofficial18@gmail.com');
```

## After Running SQL

1. **Clear browser localStorage:**
   - Open browser console (F12)
   - Type: `localStorage.clear()`
   - Press Enter

2. **Refresh the page**

3. **Login again:**
   - Email: `lokeshhofficial18@gmail.com`
   - Password: your password

4. **Check console logs:**
   You should see:
   ```
   [signIn] Attempting login for: lokeshhofficial18@gmail.com
   [signIn] Success: lokeshhofficial18@gmail.com
   [onAuthStateChange] Event: SIGNED_IN Session: YES
   [handleSession] Called with session: YES
   [handleSession] Fetching role for: lokeshhofficial18@gmail.com
   [fetchRole] Starting for user: <user-id>
   [fetchRole] DB query result: {data: {role: 'admin'}, error: null}
   [fetchRole] Returning role: admin
   [handleSession] Role set to: admin
   [handleSession] Loading set to FALSE
   ```

5. **Should redirect to:** `/campus-hub-admin`

## If Still Not Working

### Check if RLS is enabled on user_roles:
```sql
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'user_roles';
```

Should return `relrowsecurity: true`

### Temporarily disable RLS for testing:
```sql
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
```

Then test login again. If it works, the issue is definitely RLS policies.

### Re-enable RLS with correct policies:
```sql
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

Then run the policy creation script above again.

## Signout Issue

If signout button doesn't work, it's because the auth state is stuck. After fixing the RLS policies, signout should work. If not:

1. Clear localStorage: `localStorage.clear()`
2. Clear browser cache
3. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
4. Try again

## Quick Test Query

Run this to verify everything is set up correctly:

```sql
-- Check user exists
SELECT id, email FROM auth.users 
WHERE email = 'lokeshhofficial18@gmail.com';

-- Check role exists
SELECT ur.role, ur.user_id 
FROM public.user_roles ur
WHERE ur.user_id = (SELECT id FROM auth.users WHERE email = 'lokeshhofficial18@gmail.com');

-- Check policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_roles';
```

All three queries should return results.
