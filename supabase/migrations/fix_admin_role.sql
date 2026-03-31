-- =====================================================
-- FIX ADMIN USER ROLE IN SUPABASE
-- Run this in Supabase SQL Editor if admin role is missing
-- =====================================================

-- 1. Check if the admin user exists
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'lokeshhofficial18@gmail.com';

-- 2. Check current role for admin user (FIXED - no created_at in user_roles)
SELECT 
  ur.role,
  ur.user_id,
  au.created_at
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'lokeshhofficial18@gmail.com';

-- 3. If role is missing or incorrect, run this to fix it:
-- First, delete any existing roles
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'lokeshhofficial18@gmail.com');

-- Then insert the correct admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'lokeshhofficial18@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- 4. Verify the fix
SELECT 
  au.email,
  ur.role,
  au.created_at as user_created
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE au.email = 'lokeshhofficial18@gmail.com';

-- 5. Check all users and their roles
SELECT 
  au.email,
  au.email_confirmed_at,
  ur.role,
  au.created_at as user_created
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
ORDER BY au.created_at DESC;
