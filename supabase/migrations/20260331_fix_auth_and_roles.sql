-- =====================================================
-- FIX AUTHENTICATION AND 3-TIER ROLE SYSTEM
-- =====================================================

-- 1. First, drop the old trigger to prevent conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop and recreate the function with proper 3-tier roles
CREATE OR REPLACE FUNCTION public.create_user_profile_and_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile (handle duplicates gracefully)
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (user_id) DO NOTHING;

  -- Assign role based on email
  IF NEW.email = 'lokeshhofficial18@gmail.com' THEN
    -- Campus Hub Admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  ELSIF NEW.email LIKE '%admin%' OR NEW.email LIKE '%club%' THEN
    -- Club/Event Admin - users with admin/club in email
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'club_admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'club_admin';
  ELSE
    -- Regular Student/User
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student')
    ON CONFLICT (user_id) DO UPDATE SET role = 'student';
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Create the trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile_and_role();

-- 4. Update existing users' roles (if any)
-- Assign admin role to the Campus Hub Admin email
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'lokeshhofficial18@gmail.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Delete existing roles for this user
    DELETE FROM public.user_roles WHERE user_id = admin_user_id;
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    
    -- Update profile name if needed
    UPDATE public.profiles 
    SET name = COALESCE(name, 'Campus Hub Admin')
    WHERE user_id = admin_user_id;
  END IF;
END $$;

-- 5. Ensure club_admin role exists in enum (if not already added)
-- Note: This migration assumes the enum was already updated in a previous migration
-- If you get an error, run this first in a separate migration:
-- ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'club_admin' BEFORE 'admin';

-- 6. Update RLS policies for clubs table
DROP POLICY IF EXISTS "Clubs are viewable by everyone" ON public.clubs;
CREATE POLICY "Clubs are viewable by everyone"
  ON public.clubs FOR SELECT 
  USING (status = 'approved' OR auth.uid() = admin_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create clubs" ON public.clubs;
CREATE POLICY "Users can create clubs"
  ON public.clubs FOR INSERT 
  WITH CHECK (auth.uid() = admin_id);

DROP POLICY IF EXISTS "Club admins can update their own clubs" ON public.clubs;
CREATE POLICY "Club admins can update their own clubs"
  ON public.clubs FOR UPDATE 
  USING (auth.uid() = admin_id);

DROP POLICY IF EXISTS "CampusHub admins can update all clubs" ON public.clubs;
CREATE POLICY "CampusHub admins can update all clubs"
  ON public.clubs FOR UPDATE 
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "CampusHub admins can delete clubs" ON public.clubs;
CREATE POLICY "CampusHub admins can delete clubs"
  ON public.clubs FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Update RLS policies for events table
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
CREATE POLICY "Events are viewable by everyone"
  ON public.events FOR SELECT 
  USING (status = 'approved' OR auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can create events" ON public.events;
CREATE POLICY "Anyone can create events"
  ON public.events FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Event creators or club admins can update their events" ON public.events;
CREATE POLICY "Event creators or club admins can update their events"
  ON public.events FOR UPDATE 
  USING (
    auth.uid() = created_by
    OR (club_id IS NOT NULL AND auth.uid() = (SELECT admin_id FROM public.clubs WHERE id = club_id))
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Event creators or club admins can delete their events" ON public.events;
CREATE POLICY "Event creators or club admins can delete their events"
  ON public.events FOR DELETE 
  USING (
    auth.uid() = created_by
    OR (club_id IS NOT NULL AND auth.uid() = (SELECT admin_id FROM public.clubs WHERE id = club_id))
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "CampusHub admins can approve/reject events" ON public.events;
CREATE POLICY "CampusHub admins can approve/reject events"
  ON public.events FOR UPDATE 
  USING (public.has_role(auth.uid(), 'admin'));

-- 8. Ensure approval_history RLS is correct
DROP POLICY IF EXISTS "CampusHub admins can view approval history" ON public.approval_history;
CREATE POLICY "CampusHub admins can view approval history"
  ON public.approval_history FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Everyone can view own item approvals" ON public.approval_history;
CREATE POLICY "Everyone can view own item approvals"
  ON public.approval_history FOR SELECT 
  USING (
    auth.uid() = approved_by
    OR (event_id IS NOT NULL AND auth.uid() = (SELECT created_by FROM public.events WHERE id = event_id))
    OR (club_id IS NOT NULL AND auth.uid() = (SELECT admin_id FROM public.clubs WHERE id = club_id))
  );

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 10. Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;
