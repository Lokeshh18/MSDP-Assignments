-- =====================================================
-- FIX RLS POLICIES FOR USER_ROLES TABLE
-- This ensures the role query doesn't hang
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Check current RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_roles';

-- 2. Drop old policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_roles;

-- 3. Create simple, permissive policy for reading own role
-- This allows ANY authenticated user to read their own role
CREATE POLICY "Enable read access for own role"
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 4. Also allow admins to read all roles
CREATE POLICY "Enable read access for admins"
  ON public.user_roles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- 5. Enable users to insert their own role (for signup trigger)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_roles;
CREATE POLICY "Enable insert for authenticated users"
  ON public.user_roles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 6. Allow admins to manage all roles
DROP POLICY IF EXISTS "Enable admin full access" ON public.user_roles;
CREATE POLICY "Enable admin full access"
  ON public.user_roles 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- 7. Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_roles';

-- 8. Test the query as the admin user
-- (This simulates what the app does)
SELECT role FROM public.user_roles WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'lokeshhofficial18@gmail.com'
);
