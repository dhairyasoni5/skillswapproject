import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Clock, CheckCircle, XCircle, Star, Loader2, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Requests() {
  const { user, loading } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading1, setLoading1] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

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

    // 1. Fetch swap requests
    let query = supabase
      .from('swap_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!currentUserProfile?.is_admin) {
      query = query.or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
    }

    const { data: swapRequests, error: swapError } = await query;

    // 2. Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name, profile_photo_url');

    // 3. Fetch all skills
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name');

    // 4. Join profiles and skills to swap requests
    if (!swapError && !profilesError && !skillsError && swapRequests && profiles && skills) {
      const requestsWithDetails = swapRequests.map(req => ({
        ...req,
        requesterProfile: profiles.find(p => p.user_id === req.requester_id),
        recipientProfile: profiles.find(p => p.user_id === req.recipient_id),
        offered_skill: { name: skills.find(s => s.id === req.offered_skill_id)?.name || 'Unknown Skill' },
        wanted_skill: { name: skills.find(s => s.id === req.wanted_skill_id)?.name || 'Unknown Skill' }
      }));
      setRequests(requestsWithDetails);
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
      
      // If marking as completed, show rating dialog
      if (status === 'completed') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          setSelectedRequest(request);
          setShowRatingDialog(true);
        }
      } else {
        fetchRequests();
      }
    }
  };

  const submitRating = async () => {
    if (!selectedRequest || !user) return;

    const otherUserId = selectedRequest.requester_id === user.id 
      ? selectedRequest.recipient_id 
      : selectedRequest.requester_id;

    const { error } = await supabase
      .from('ratings')
      .insert({
        swap_request_id: selectedRequest.id,
        rater_id: user.id,
        rated_id: otherUserId,
        rating: rating,
        feedback: feedback
      });

    if (!error) {
      toast({
        title: "Rating submitted",
        description: "Thank you for your feedback!",
      });
      setShowRatingDialog(false);
      setSelectedRequest(null);
      setRating(5);
      setFeedback('');
      fetchRequests();
    } else {
      toast({
        title: "Error",
        description: "Failed to submit rating.",
        variant: "destructive",
      });
    }
  };

  const cancelRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('swap_requests')
      .delete()
      .eq('id', requestId);

    if (!error) {
      toast({
        title: "Request cancelled",
        description: "Your swap request has been cancelled.",
      });
      fetchRequests();
    } else {
      toast({
        title: "Error",
        description: "Failed to cancel request.",
        variant: "destructive",
      });
    }
  };

  const getFilteredRequests = () => {
    if (!user) return [];
    
    switch (activeTab) {
      case 'incoming':
        return requests.filter(req => req.recipient_id === user.id);
      case 'outgoing':
        return requests.filter(req => req.requester_id === user.id);
      default:
        return requests;
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="incoming">Incoming</TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {getFilteredRequests().length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredRequests().map((request) => {
                  const isRequester = request.requester_id === user.id;
                  const otherUser = isRequester ? request.recipientProfile : request.requesterProfile;
                  
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

                        {isRequester && request.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => cancelRequest(request.id)}
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Cancel Request
                          </Button>
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
          </TabsContent>

          <TabsContent value="incoming" className="space-y-4">
            {getFilteredRequests().length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No incoming requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredRequests().map((request) => {
                  const otherUser = request.requesterProfile;
                  
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
                                Request received
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

                        {request.status === 'pending' && (
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
          </TabsContent>

          <TabsContent value="outgoing" className="space-y-4">
            {getFilteredRequests().length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No outgoing requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredRequests().map((request) => {
                  const otherUser = request.recipientProfile;
                  
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
                                Request sent
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

                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => cancelRequest(request.id)}
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Cancel Request
                          </Button>
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rate Your Swap Experience</DialogTitle>
            <DialogDescription>
              How was your experience with this skill swap?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rating">Rating</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    variant="ghost"
                    size="sm"
                    onClick={() => setRating(star)}
                    className={`p-1 ${rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                  >
                    <Star className="h-5 w-5 fill-current" />
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            </div>
            
            <div>
              <Label htmlFor="feedback">Feedback (Optional)</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                className="mt-2"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={submitRating}
                className="flex-1"
              >
                Submit Rating
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRatingDialog(false);
                  setSelectedRequest(null);
                  setRating(5);
                  setFeedback('');
                }}
                className="flex-1"
              >
                Skip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Navigation />
    </div>
  );
}