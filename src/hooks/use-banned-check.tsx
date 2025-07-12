import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const useBannedCheck = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkBanStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkBanStatus = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('is_banned, ban_reason')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setIsBanned(data.is_banned || false);
      setBanReason(data.ban_reason);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isBanned && !loading) {
      // Redirect to a ban page or show ban message
      navigate('/banned', { replace: true });
    }
  }, [isBanned, loading, navigate]);

  return { isBanned, banReason, loading };
}; 