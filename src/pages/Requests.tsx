import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Clock, CheckCircle, XCircle, Star, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Requests() {
  const { user, loading } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading1, setLoading1] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchRequests();
      fetchCurrentUserProfile();
    }
  }, [user]);

  const fetchCurrentUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();
    if (data) setCurrentUserProfile(data);
  };

  const fetchRequests = async () => {
    if (!user) return;
    setLoading1(true);
    
    const { data, error } = await supabase
      .from('swap_requests')
      .select(`
        *,
        requester:profiles!swap_requests_requester_id_fkey(name, profile_photo_url),
        recipient:profiles!swap_requests_recipient_id_fkey(name, profile_photo_url),
        offered_skill:skills!swap_requests_offered_skill_id_fkey(name),
        wanted_skill:skills!swap_requests_wanted_skill_id_fkey(name)
      `)
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setLoading1(false);
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    const { error } = await supabase
      .from('swap_requests')
      .update({ status })
      .eq('id', requestId);

    if (!error) {
      toast({
        title: "Request updated",
        description: `Request has been ${status}.`,
      });
      fetchRequests();
    }
  };

  if (loading || loading1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle pb-20">
      <header className="bg-card border-b border-border shadow-soft sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="font-display text-xl font-bold text-foreground">
            My Requests
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your skill swap requests
          </p>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No requests yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const isRequester = request.requester_id === user.id;
              const otherUser = isRequester ? request.recipient : request.requester;
              
              return (
                <Card key={request.id} className="shadow-medium border-0">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={otherUser?.profile_photo_url} />
                          <AvatarFallback>
                            {otherUser?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{otherUser?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {isRequester ? 'Request sent' : 'Request received'}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          request.status === 'accepted' ? 'success' :
                          request.status === 'rejected' ? 'destructive' :
                          request.status === 'completed' ? 'default' : 'secondary'
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <p><strong>Offering:</strong> {request.offered_skill?.name}</p>
                      <p><strong>Wanting:</strong> {request.wanted_skill?.name}</p>
                    </div>
                    
                    {request.message && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">{request.message}</p>
                      </div>
                    )}

                    {!isRequester && request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, 'accepted')}
                          className="bg-success hover:bg-success/90"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateRequestStatus(request.id, 'rejected')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {request.status === 'accepted' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRequestStatus(request.id, 'completed')}
                        className="w-full"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Mark as Completed
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Navigation isAdmin={currentUserProfile?.is_admin} />
    </div>
  );
}