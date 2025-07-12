import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Requests() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading1, setLoading1] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const requestsPerPage = 3;

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
      .select('*')
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

  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchTerm === '' || 
      request.requester?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.recipient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.offered_skill?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.wanted_skill?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);
  const startIndex = (currentPage - 1) * requestsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + requestsPerPage);

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
      {/* Header */}
      <header className="bg-card border-b border-border shadow-soft sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                Skill Swap Platform
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your requests
              </p>
            </div>
            <Avatar 
              className="h-8 w-8 cursor-pointer"
              onClick={() => navigate('/profile')}
            >
              <AvatarImage src={currentUserProfile?.profile_photo_url} />
              <AvatarFallback className="text-xs">
                {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Search and Filter */}
      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="max-w-md mx-auto px-4">
        {loading1 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : paginatedRequests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' ? 'No requests match your filters.' : 'No requests yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedRequests.map((request) => {
              const isRequester = request.requester_id === user.id;
              const otherUser = isRequester ? request.recipient : request.requester;
              
              return (
                <Card key={request.id} className="shadow-medium border-0">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={otherUser?.profile_photo_url} />
                          <AvatarFallback>
                            {otherUser?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-lg">{otherUser?.name}</h3>
                          <div className="text-sm space-y-1">
                            <p><span className="text-primary">Skills Offered →</span> <span className="text-muted-foreground">{request.offered_skill?.name}</span></p>
                            <p><span className="text-primary">Skill wanted →</span> <span className="text-muted-foreground">{request.wanted_skill?.name}</span></p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant={
                            request.status === 'accepted' ? 'success' :
                            request.status === 'rejected' ? 'destructive' :
                            request.status === 'completed' ? 'default' : 'secondary'
                          }
                          className="mb-2"
                        >
                          {request.status}
                        </Badge>
                        {!isRequester && request.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => updateRequestStatus(request.id, 'accepted')}
                              className="bg-success hover:bg-success/90 text-xs px-3"
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateRequestStatus(request.id, 'rejected')}
                              className="text-xs px-3"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {isRequester && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-3"
                          >
                            Request
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {request.message && (
                    <CardContent className="pt-0">
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">{request.message}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 pb-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
        )}
      </div>

      <Navigation isAdmin={currentUserProfile?.is_admin} />
    </div>
  );
}