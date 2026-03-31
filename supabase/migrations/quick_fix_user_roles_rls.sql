-- =====================================================
-- QUICK FIX - USER_ROLES RLS POLICIES
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop all existing policies on user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_read_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_read_all" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_own" ON public.user_roles;

-- Step 2: Create simple permissive policies

-- Allow ANY authenticated user to read ANY role (needed for the app to work)
CREATE POLICY "user_roles_select_authenticated"
  ON public.user_roles 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Allow insert for authenticated users
CREATE POLICY "user_roles_insert_authenticated"
  ON public.user_roles 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Allow update for own user or admin
CREATE POLICY "user_roles_update_own_or_admin"
  ON public.user_roles 
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Step 3: Verify policies created
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'user_roles';

-- Step 4: Test the query
SELECT role FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'lokeshhofficial18@gmail.com');

-- Should return: admin
