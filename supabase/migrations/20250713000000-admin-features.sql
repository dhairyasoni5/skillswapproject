-- Add admin features to existing database
-- This migration only adds new columns and tables for admin functionality

-- Add ban fields to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Add rejection reason to existing skills table
ALTER TABLE public.skills 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create platform_messages table for admin announcements
CREATE TABLE IF NOT EXISTS public.platform_messages (
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
CREATE TABLE IF NOT EXISTS public.skill_moderation_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for new tables
ALTER TABLE public.platform_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_moderation_queue ENABLE ROW LEVEL SECURITY;

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

-- Add admin policies to existing tables
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles FOR ALL 
USING (EXISTS(SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can view all swap requests" 
ON public.swap_requests FOR SELECT 
USING (EXISTS(SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

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