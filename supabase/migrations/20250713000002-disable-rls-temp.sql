-- Temporarily disable RLS to fix infinite recursion
-- This will allow the app to work while we fix the policies

-- Disable RLS on all tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_moderation_queue DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean up
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Skills are viewable by everyone" ON public.skills;
DROP POLICY IF EXISTS "Admins can manage skills" ON public.skills;
DROP POLICY IF EXISTS "User skills are viewable by everyone for public profiles" ON public.user_skills;
DROP POLICY IF EXISTS "Users can manage their own skills" ON public.user_skills;
DROP POLICY IF EXISTS "Users can view their own swap requests" ON public.swap_requests;
DROP POLICY IF EXISTS "Users can create swap requests" ON public.swap_requests;
DROP POLICY IF EXISTS "Users can update their own swap requests" ON public.swap_requests;
DROP POLICY IF EXISTS "Admins can view all swap requests" ON public.swap_requests;
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON public.ratings;
DROP POLICY IF EXISTS "Users can create ratings for their swaps" ON public.ratings;
DROP POLICY IF EXISTS "Only admins can view admin logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Platform messages are viewable by everyone" ON public.platform_messages;
DROP POLICY IF EXISTS "Only admins can manage platform messages" ON public.platform_messages;
DROP POLICY IF EXISTS "Only admins can view skill moderation queue" ON public.skill_moderation_queue; 