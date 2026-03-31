-- =====================================================
-- RUN THIS FIRST - Complete Fix for Auth & Dashboard
-- Copy ENTIRE script and run in Supabase SQL Editor
-- =====================================================

-- PART 1: Fix User Roles RLS Policies
-- -------------------------------------

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_read_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_read_all" ON public.user_roles;

-- Create new permissive policies
CREATE POLICY "user_roles_select_authenticated"
  ON public.user_roles 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "user_roles_insert_authenticated"
  ON public.user_roles 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

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

-- PART 2: Verify Admin User Role
-- -------------------------------------

-- Check if admin user exists and has correct role
SELECT 
  au.email,
  ur.role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE au.email = 'lokeshhofficial18@gmail.com';

-- If role is NULL or wrong, fix it:
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'lokeshhofficial18@gmail.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Delete existing roles
    DELETE FROM public.user_roles WHERE user_id = admin_user_id;
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    
    RAISE NOTICE 'Admin role set for lokeshhofficial18@gmail.com';
  ELSE
    RAISE NOTICE 'Admin user not found in auth.users';
  END IF;
END $$;

-- PART 3: Verify Everything
-- -------------------------------------

-- Check policies exist
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'user_roles';

-- Check admin role is set
SELECT 
  au.email,
  ur.role,
  au.email_confirmed_at
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE au.email = 'lokeshhofficial18@gmail.com';

-- Test the role query (simulates what app does)
SELECT role FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'lokeshhofficial18@gmail.com');

-- =====================================================
-- AFTER RUNNING:
-- 1. Clear browser localStorage: localStorage.clear()
-- 2. Refresh page (F5)
-- 3. Login with lokeshhofficial18@gmail.com
-- 4. Should redirect to /campus-hub-admin
-- =====================================================
