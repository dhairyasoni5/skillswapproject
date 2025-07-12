import { supabase } from '@/integrations/supabase/client';

export const checkAdminStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single();

    if (!error && data) {
      return data.is_admin || false;
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const makeUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    console.error('Error making user admin:', error);
    return false;
  }
};

export const banUser = async (userId: string, reason: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_banned: true, 
        ban_reason: reason 
      })
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    console.error('Error banning user:', error);
    return false;
  }
};

export const unbanUser = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_banned: false, 
        ban_reason: null 
      })
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    console.error('Error unbanning user:', error);
    return false;
  }
};

export const moderateSkill = async (skillId: string, approved: boolean, reason?: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('skills')
      .update({ 
        is_approved: approved,
        rejection_reason: approved ? null : reason 
      })
      .eq('id', skillId);

    return !error;
  } catch (error) {
    console.error('Error moderating skill:', error);
    return false;
  }
};

export const createPlatformMessage = async (title: string, message: string, messageType: string, adminId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('platform_messages')
      .insert({
        title,
        message,
        message_type: messageType,
        admin_id: adminId
      });

    return !error;
  } catch (error) {
    console.error('Error creating platform message:', error);
    return false;
  }
}; 