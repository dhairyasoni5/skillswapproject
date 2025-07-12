import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { ProfileCard } from '@/components/ProfileCard';
import { Navigation } from '@/components/Navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, Loader2 } from 'lucide-react';
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

interface Skill {
  id: string;
  name: string;
  category?: string;
}

export default function Browse() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading1, setLoading1] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchProfiles();
      fetchSkills();
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

  const fetchSkills = async () => {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('is_approved', true)
      .order('name');

    if (!error && data) {
      setSkills(data);
    }
  };

  const fetchProfiles = async () => {
    setLoading1(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
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
        .neq('user_id', user?.id);

      if (profilesError) throw profilesError;

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
    navigate(`/request/${profileId}`);
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = searchTerm === '' || 
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSkill = selectedSkill === 'all' || 
      profile.skillsOffered.some(skill => skill.id === selectedSkill) ||
      profile.skillsWanted.some(skill => skill.id === selectedSkill);

    const matchesAvailability = availability === 'all' || 
      (profile as any).availability?.includes(availability);

    return matchesSearch && matchesSkill && matchesAvailability;
  });

  const popularSkills = skills.slice(0, 6);

  if (loading) {
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
          <h1 className="font-display text-xl font-bold text-foreground">
            Browse Skills
          </h1>
          <p className="text-sm text-muted-foreground">
            Discover people with amazing skills
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Select value={selectedSkill} onValueChange={setSelectedSkill}>
            <SelectTrigger>
              <SelectValue placeholder="All Skills" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {skills.map((skill) => (
                <SelectItem key={skill.id} value={skill.id}>
                  {skill.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={availability} onValueChange={setAvailability}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Times</SelectItem>
              <SelectItem value="weekdays">Weekdays</SelectItem>
              <SelectItem value="weekends">Weekends</SelectItem>
              <SelectItem value="evenings">Evenings</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Popular Skills */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Popular Skills</p>
          <div className="flex flex-wrap gap-2">
            {popularSkills.map((skill) => (
              <Badge
                key={skill.id}
                variant={selectedSkill === skill.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedSkill(selectedSkill === skill.id ? 'all' : skill.id)}
              >
                {skill.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="max-w-md mx-auto px-4">
        {loading1 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || selectedSkill !== 'all' || availability !== 'all' 
                ? 'No profiles match your filters.' 
                : 'No public profiles available.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProfiles.map((profile) => (
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
      </div>

      <Navigation isAdmin={currentUserProfile?.is_admin} />
    </div>
  );
}