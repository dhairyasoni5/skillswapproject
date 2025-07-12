import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { ProfileCard } from '@/components/ProfileCard';
import { Navigation } from '@/components/Navigation';
import { PlatformMessages } from '@/components/PlatformMessages';
import { useBannedCheck } from '@/hooks/use-banned-check';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Loader2, Bell, X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  location?: string;
  profile_photo_url?: string;
  skillsOffered: any[];
  skillsWanted: any[];
  averageRating?: number;
}

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useBannedCheck(); // Check if user is banned
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading1, setLoading1] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [availability, setAvailability] = useState('all');
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [platformMessages, setPlatformMessages] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(true);
  
  const profilesPerPage = 3;

  useEffect(() => {
    fetchProfiles();
    fetchPlatformMessages();
    if (user) {
      fetchCurrentUserProfile();
    }
  }, [user]);

  const fetchCurrentUserProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setCurrentUserProfile(data);
    }
  };

  const fetchPlatformMessages = async () => {
    const { data, error } = await (supabase as any)
      .from('platform_messages')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPlatformMessages(data);
    }
  };

  const fetchProfiles = async () => {
    setLoading1(true);
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          name,
          location,
          profile_photo_url,
          availability
        `)
        .eq('privacy_setting', 'public')
        .eq('is_banned', false);

      if (user?.id) {
        query = query.neq('user_id', user.id);
      }

      const { data: profilesData, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      // Fetch skills for each profile
      const profilesWithSkills = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: skillsData, error: skillsError } = await supabase
            .from('user_skills')
            .select(`
              skill_type,
              skills (
                id,
                name,
                category
              )
            `)
            .eq('user_id', profile.user_id);

          if (skillsError) {
            console.error('Error fetching skills:', skillsError);
            return {
              ...profile,
              skillsOffered: [],
              skillsWanted: []
            };
          }

          const skillsOffered = skillsData
            ?.filter(s => s.skill_type === 'offered')
            .map(s => s.skills) || [];
          
          const skillsWanted = skillsData
            ?.filter(s => s.skill_type === 'wanted')
            .map(s => s.skills) || [];

          // Fetch average rating
          const { data: ratingsData } = await supabase
            .from('ratings')
            .select('rating')
            .eq('rated_id', profile.user_id);

          const averageRating = ratingsData && ratingsData.length > 0
            ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
            : undefined;

          return {
            ...profile,
            skillsOffered,
            skillsWanted,
            averageRating
          };
        })
      );

      setProfiles(profilesWithSkills);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load profiles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading1(false);
    }
  };

  const handleRequest = (profileId: string) => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    navigate(`/request/${profileId}`);
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = searchTerm === '' || 
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.skillsOffered.some(skill => 
        skill.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      profile.skillsWanted.some(skill => 
        skill.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesAvailability = availability === 'all' || 
      (profile as any).availability?.includes(availability);

    // Hide incomplete profiles (no skills offered and no skills wanted)
    const hasSkills = (profile.skillsOffered && profile.skillsOffered.length > 0) ||
                     (profile.skillsWanted && profile.skillsWanted.length > 0);

    return matchesSearch && matchesAvailability && hasSkills;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProfiles.length / profilesPerPage);
  const startIndex = (currentPage - 1) * profilesPerPage;
  const paginatedProfiles = filteredProfiles.slice(startIndex, startIndex + profilesPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-soft sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                SkillSwap Platform
              </h1>
              <p className="text-sm text-muted-foreground">
                Find your perfect skill match
              </p>
            </div>
            {user ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/requests')}
                  className="relative"
                >
                  <Bell className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="h-4 w-4" />
                  {platformMessages.length > 0 && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                  )}
                </Button>
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
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/auth')}
                className="font-medium"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Platform Notifications */}
      {showNotifications && platformMessages.length > 0 && (
        <div className="max-w-md mx-auto px-4 py-4 space-y-3">
          {platformMessages.map((message) => (
            <Alert key={message.id} className="border-l-4 border-l-primary">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {message.message_type === 'alert' ? (
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  ) : message.message_type === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                  ) : message.message_type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                  ) : (
                    <Info className="h-4 w-4 text-primary mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant={
                          message.message_type === 'alert' ? 'destructive' :
                          message.message_type === 'warning' ? 'secondary' :
                          message.message_type === 'success' ? 'default' : 'outline'
                        }
                        className="text-xs"
                      >
                        {message.message_type}
                      </Badge>
                      <span className="font-medium text-sm">{message.title}</span>
                    </div>
                    <AlertDescription className="text-sm">
                      {message.message}
                    </AlertDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Search and Filter */}
      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search skills or people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={availability} onValueChange={setAvailability}>
            <SelectTrigger className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Availability</SelectItem>
              <SelectItem value="weekdays">Weekdays</SelectItem>
              <SelectItem value="weekends">Weekends</SelectItem>
              <SelectItem value="evenings">Evenings</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="max-w-md mx-auto px-4">
        {loading1 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : paginatedProfiles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'No profiles match your search.' : 'No public profiles available.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedProfiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={{
                  ...profile,
                  rating: profile.averageRating
                }}
                onRequest={handleRequest}
              />
            ))}
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

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to send swap requests.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={() => {
                setShowLoginDialog(false);
                navigate('/auth');
              }}
              className="flex-1"
            >
              Login
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowLoginDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Navigation />
    </div>
  );
}