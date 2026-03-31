-- =====================================================
-- COMPLETE 3-TIER ROLE SYSTEM MIGRATION
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Drop and recreate the enum with all 3 roles
-- Note: PostgreSQL doesn't allow dropping enum values, so we recreate the type
DO $$ BEGIN
    -- Check if club_admin already exists
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'club_admin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE public.app_role ADD VALUE 'club_admin' BEFORE 'admin';
    END IF;
END $$;

-- 2. Ensure user_roles table exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Ensure profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Ensure clubs table exists
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  poster_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- 5. Ensure events table has required columns
DO $$ BEGIN
    -- Add status column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'status') THEN
        ALTER TABLE public.events ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
    END IF;
    
    -- Add club_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'club_id') THEN
        ALTER TABLE public.events ADD COLUMN club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL;
    END IF;
    
    -- Add is_approved column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_approved') THEN
        ALTER TABLE public.events ADD COLUMN is_approved BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 6. Ensure approval_history table exists
CREATE TABLE IF NOT EXISTS public.approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'pending')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;

-- 7. Ensure registrations table exists
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, event_id)
);
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- 8. Create has_role function (security definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 9. Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 10. Drop old triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- 11. Create the unified user creation function
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
  ELSIF LOWER(NEW.email) LIKE '%admin%' OR LOWER(NEW.email) LIKE '%club%' THEN
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

-- 12. Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile_and_role();

-- 13. Update existing Campus Hub Admin user
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

-- 14. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_club_id ON public.events(club_id);
CREATE INDEX IF NOT EXISTS idx_clubs_status ON public.clubs(status);
CREATE INDEX IF NOT EXISTS idx_clubs_admin_id ON public.clubs(admin_id);

-- 15. RLS Policies for profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 16. RLS Policies for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 17. RLS Policies for clubs
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

-- 18. RLS Policies for events
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

-- 19. RLS Policies for registrations
DROP POLICY IF EXISTS "Students can view their own registrations" ON public.registrations;
CREATE POLICY "Students can view their own registrations"
  ON public.registrations FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can view all registrations" ON public.registrations;
CREATE POLICY "Admins can view all registrations"
  ON public.registrations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Students can register for events" ON public.registrations;
CREATE POLICY "Students can register for events"
  ON public.registrations FOR INSERT
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can update registration status" ON public.registrations;
CREATE POLICY "Admins can update registration status"
  ON public.registrations FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- 20. RLS Policies for approval_history
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

-- 21. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 22. Attach updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_clubs_updated_at ON public.clubs;
CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- The 3-tier role system is now set up:
-- 1. student - Regular users
-- 2. club_admin - Club/Event administrators
-- 3. admin - Campus Hub administrators (lokeshhofficial18@gmail.com)
-- =====================================================
