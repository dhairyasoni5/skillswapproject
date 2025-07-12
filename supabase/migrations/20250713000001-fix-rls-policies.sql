  -- Fix infinite recursion in RLS policies
  -- Drop the problematic policies first
  DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Admins can view all swap requests" ON public.swap_requests;
  DROP POLICY IF EXISTS "Only admins can manage platform messages" ON public.platform_messages;
  DROP POLICY IF EXISTS "Only admins can view skill moderation queue" ON public.skill_moderation_queue;

  -- Create fixed policies that avoid recursion
  CREATE POLICY "Admins can manage all profiles" 
  ON public.profiles FOR ALL 
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE is_admin = true
    )
  );

  CREATE POLICY "Admins can view all swap requests" 
  ON public.swap_requests FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE is_admin = true
    )
  );

  CREATE POLICY "Only admins can manage platform messages" 
  ON public.platform_messages FOR ALL 
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE is_admin = true
    )
  );

  CREATE POLICY "Only admins can view skill moderation queue" 
  ON public.skill_moderation_queue FOR ALL 
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE is_admin = true
    )
  ); 