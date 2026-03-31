-- =====================================================
-- DISABLE EMAIL CONFIRMATION (Development Only)
-- Run this in Supabase SQL Editor to allow instant login
-- =====================================================

-- This disables email confirmation for development
-- Users can log in immediately after signup without confirming email

-- Update auth settings to disable email confirmation
-- Note: This requires Supabase admin access

-- Option 1: Using Supabase Dashboard (Recommended)
-- Go to: Authentication → Providers → Email
-- Toggle off "Confirm email"

-- Option 2: If you have access to auth settings via SQL
-- (This may not work on all Supabase plans)

-- For production, re-enable email confirmation:
-- Go to Authentication → Email Templates
-- Customize the confirmation email template

-- =====================================================
-- MANUAL USER CREATION (Alternative for testing)
-- =====================================================

-- If you want to manually create a test user in Supabase Auth:
-- 1. Go to Authentication → Users
-- 2. Click "Add user" → "Create new user"
-- 3. Enter email and password
-- 4. Uncheck "Confirm email" for instant access

-- Then manually assign roles:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('your-user-id-here', 'admin');

-- =====================================================
-- CHECK EXISTING USERS
-- =====================================================

-- View all users and their roles
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.created_at,
  ur.role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
ORDER BY au.created_at DESC;

-- =====================================================
-- FIX USER ROLES (If needed)
-- =====================================================

-- Manually assign admin role to Campus Hub Admin
UPDATE public.user_roles 
SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'lokeshhofficial18@gmail.com');

-- Manually assign club_admin role
-- UPDATE public.user_roles 
-- SET role = 'club_admin'
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-club-admin-email');

-- Manually assign student role
-- UPDATE public.user_roles 
-- SET role = 'student'
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-student-email');
