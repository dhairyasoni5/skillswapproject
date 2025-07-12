-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  profile_photo_url TEXT,
  availability TEXT[] DEFAULT '{}',
  privacy_setting TEXT DEFAULT 'public' CHECK (privacy_setting IN ('public', 'private')),
  is_admin BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skills table
CREATE TABLE public.skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  is_approved BOOLEAN DEFAULT true,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_skills table for skills offered and wanted
CREATE TABLE public.user_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  skill_type TEXT NOT NULL CHECK (skill_type IN ('offered', 'wanted')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_id, skill_type)
);

-- Create swap_requests table
CREATE TABLE public.swap_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offered_skill_id UUID NOT NULL REFERENCES public.skills(id),
  wanted_skill_id UUID NOT NULL REFERENCES public.skills(id),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ratings table
CREATE TABLE public.ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  swap_request_id UUID NOT NULL REFERENCES public.swap_requests(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(swap_request_id, rater_id)
);

-- Create admin_logs table
CREATE TABLE public.admin_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create platform_messages table for admin announcements
CREATE TABLE public.platform_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'info' CHECK (message_type IN ('info', 'warning', 'alert', 'update')),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skill_moderation_queue table for pending skill approvals
CREATE TABLE public.skill_moderation_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_moderation_queue ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (privacy_setting = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admin can manage all profiles
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles FOR ALL 
USING (EXISTS(SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

-- Skills policies (public read, admin write)
CREATE POLICY "Skills are viewable by everyone" 
ON public.skills FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage skills" 
ON public.skills FOR ALL 
USING (EXISTS(SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

-- User skills policies
CREATE POLICY "User skills are viewable by everyone for public profiles" 
ON public.user_skills FOR SELECT 
USING (EXISTS(SELECT 1 FROM profiles WHERE user_id = user_skills.user_id AND (privacy_setting = 'public' OR user_id = auth.uid())));

CREATE POLICY "Users can manage their own skills" 
ON public.user_skills FOR ALL 
USING (auth.uid() = user_id);

-- Swap requests policies
CREATE POLICY "Users can view their own swap requests" 
ON public.swap_requests FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create swap requests" 
ON public.swap_requests FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own swap requests" 
ON public.swap_requests FOR UPDATE 
USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Admin can view all swap requests
CREATE POLICY "Admins can view all swap requests" 
ON public.swap_requests FOR SELECT 
USING (EXISTS(SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

-- Ratings policies
CREATE POLICY "Ratings are viewable by everyone" 
ON public.ratings FOR SELECT 
USING (true);

CREATE POLICY "Users can create ratings for their swaps" 
ON public.ratings FOR INSERT 
WITH CHECK (auth.uid() = rater_id);

-- Admin logs policies
CREATE POLICY "Only admins can view admin logs" 
ON public.admin_logs FOR ALL 
USING (EXISTS(SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

-- Platform messages policies
CREATE POLICY "Platform messages are viewable by everyone" 
ON public.platform_messages FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can manage platform messages" 
ON public.platform_messages FOR ALL 
USING (EXISTS(SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

-- Skill moderation queue policies
CREATE POLICY "Only admins can view skill moderation queue" 
ON public.skill_moderation_queue FOR ALL 
USING (EXISTS(SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_swap_requests_updated_at
  BEFORE UPDATE ON public.swap_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', 'New User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT,
  p_target_type TEXT,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to ban/unban users
CREATE OR REPLACE FUNCTION public.ban_user(
  p_user_id UUID,
  p_ban_reason TEXT DEFAULT NULL,
  p_ban BOOLEAN DEFAULT true
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET is_banned = p_ban, ban_reason = CASE WHEN p_ban THEN p_ban_reason ELSE NULL END
  WHERE user_id = p_user_id;
  
  PERFORM public.log_admin_action(
    CASE WHEN p_ban THEN 'ban_user' ELSE 'unban_user' END,
    'user',
    p_user_id,
    jsonb_build_object('reason', p_ban_reason, 'banned', p_ban)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to approve/reject skills
CREATE OR REPLACE FUNCTION public.moderate_skill(
  p_skill_id UUID,
  p_approved BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.skills 
  SET is_approved = p_approved, rejection_reason = CASE WHEN NOT p_approved THEN p_reason ELSE NULL END
  WHERE id = p_skill_id;
  
  PERFORM public.log_admin_action(
    CASE WHEN p_approved THEN 'approve_skill' ELSE 'reject_skill' END,
    'skill',
    p_skill_id,
    jsonb_build_object('reason', p_reason, 'approved', p_approved)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some default skills
INSERT INTO public.skills (name, category) VALUES
  ('JavaScript', 'Programming'),
  ('Python', 'Programming'),
  ('React', 'Programming'),
  ('Photoshop', 'Design'),
  ('Figma', 'Design'),
  ('Excel', 'Business'),
  ('Guitar', 'Music'),
  ('Piano', 'Music'),
  ('Spanish', 'Language'),
  ('French', 'Language'),
  ('Photography', 'Creative'),
  ('Video Editing', 'Creative'),
  ('Marketing', 'Business'),
  ('Data Analysis', 'Business'),
  ('Cooking', 'Lifestyle'),
  ('Yoga', 'Lifestyle'),
  ('Writing', 'Creative'),
  ('Public Speaking', 'Communication');