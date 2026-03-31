-- Update app_role enum to support 3-tier system
ALTER TYPE public.app_role ADD VALUE 'club_admin' BEFORE 'admin';
-- Note: 'admin' remains as 'campushub_admin'

-- Create clubs table
CREATE TABLE public.clubs (
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

CREATE POLICY "Clubs are viewable by everyone"
  ON public.clubs FOR SELECT USING (status = 'approved' OR auth.uid() = admin_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create clubs"
  ON public.clubs FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Club admins can update their own clubs"
  ON public.clubs FOR UPDATE USING (auth.uid() = admin_id);

CREATE POLICY "CampusHub admins can update all clubs"
  ON public.clubs FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "CampusHub admins can delete clubs"
  ON public.clubs FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Add status and club_id columns to events table
ALTER TABLE public.events 
ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
ADD COLUMN is_approved BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_club_id ON public.events(club_id);
CREATE INDEX idx_clubs_status ON public.clubs(status);
CREATE INDEX idx_clubs_admin_id ON public.clubs(admin_id);

-- Update RLS policies for events
DROP POLICY "Admins can create events" ON public.events;
DROP POLICY "Admins can update events" ON public.events;
DROP POLICY "Admins can delete events" ON public.events;

CREATE POLICY "Anyone can create events"
  ON public.events FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Event creators or club admins can update their events"
  ON public.events FOR UPDATE USING (
    auth.uid() = created_by 
    OR (club_id IS NOT NULL AND auth.uid() = (SELECT admin_id FROM public.clubs WHERE id = club_id))
  );

CREATE POLICY "Event creators or club admins can delete their events"
  ON public.events FOR DELETE USING (
    auth.uid() = created_by 
    OR (club_id IS NOT NULL AND auth.uid() = (SELECT admin_id FROM public.clubs WHERE id = club_id))
  );

CREATE POLICY "CampusHub admins can approve/reject events"
  ON public.events FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Create approval_history table for tracking approvals
CREATE TABLE public.approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'pending')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CampusHub admins can view approval history"
  ON public.approval_history FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view own item approvals"
  ON public.approval_history FOR SELECT USING (
    auth.uid() = approved_by 
    OR (event_id IS NOT NULL AND auth.uid() = (SELECT created_by FROM public.events WHERE id = event_id))
    OR (club_id IS NOT NULL AND auth.uid() = (SELECT admin_id FROM public.clubs WHERE id = club_id))
  );

-- Helper function to set user role during signup
CREATE OR REPLACE FUNCTION public.create_user_profile_and_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Assign role based on email
  IF NEW.email = 'lokeshhofficial18@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for auto-creating profile and role on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile_and_role();
