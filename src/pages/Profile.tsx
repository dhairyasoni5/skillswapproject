import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Navigation } from '@/components/Navigation';
import { SkillSelector } from '@/components/SkillSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Edit3, Star, Settings, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Skill {
  id: string;
  name: string;
  category?: string;
}

interface ProfileData {
  name: string;
  location: string;
  profile_photo_url: string;
  availability: string[];
  privacy_setting: string;
  is_admin: boolean;
}

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading1, setLoading1] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    location: '',
    profile_photo_url: '',
    availability: [],
    privacy_setting: 'public',
    is_admin: false
  });

  const [skillsOffered, setSkillsOffered] = useState<Skill[]>([]);
  const [skillsWanted, setSkillsWanted] = useState<Skill[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserSkills();
      fetchRatings();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setProfile({
        name: data.name || '',
        location: data.location || '',
        profile_photo_url: data.profile_photo_url || '',
        availability: data.availability || [],
        privacy_setting: data.privacy_setting || 'public',
        is_admin: data.is_admin || false
      });
    }
    setLoading1(false);
  };

  const fetchUserSkills = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_skills')
      .select(`
        skill_type,
        skills (
          id,
          name,
          category
        )
      `)
      .eq('user_id', user.id);

    if (!error && data) {
      const offered = data.filter(s => s.skill_type === 'offered').map(s => s.skills);
      const wanted = data.filter(s => s.skill_type === 'wanted').map(s => s.skills);
      setSkillsOffered(offered);
      setSkillsWanted(wanted);
    }
  };

  const fetchRatings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('ratings')
      .select(`
        rating,
        feedback,
        created_at,
        profiles!ratings_rater_id_fkey (name)
      `)
      .eq('rated_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRatings(data);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          location: profile.location || null,
          profile_photo_url: profile.profile_photo_url || null,
          availability: profile.availability,
          privacy_setting: profile.privacy_setting
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Delete existing skills
      await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', user.id);

      // Insert new skills
      const skillsToInsert = [
        ...skillsOffered.map(skill => ({
          user_id: user.id,
          skill_id: skill.id,
          skill_type: 'offered'
        })),
        ...skillsWanted.map(skill => ({
          user_id: user.id,
          skill_id: skill.id,
          skill_type: 'wanted'
        }))
      ];

      if (skillsToInsert.length > 0) {
        const { error: skillsError } = await supabase
          .from('user_skills')
          .insert(skillsToInsert);

        if (skillsError) throw skillsError;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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
      {/* Header */}
      <header className="bg-card border-b border-border shadow-soft sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 items-center">
              {isEditing ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-success hover:bg-success/90 text-white"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                  >
                    Discard
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground cursor-pointer" onClick={() => navigate('/requests')}>Swap request</span>
                  <span className="text-sm text-muted-foreground cursor-pointer" onClick={() => navigate('/')}>Home</span>
                </>
              )}
            </div>
            <Avatar 
              className="h-8 w-8 cursor-pointer"
              onClick={() => navigate('/profile')}
            >
              <AvatarImage src={profile.profile_photo_url} />
              <AvatarFallback className="text-xs">
                {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <Card className="shadow-medium border-0">
          <CardContent className="p-6">
            <div className="flex justify-between items-start gap-6">
              {/* Left side - Form */}
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-lg font-medium">Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="border-b border-muted-foreground bg-transparent border-x-0 border-t-0 rounded-none px-0"
                    />
                  ) : (
                    <div className="border-b border-muted-foreground pb-1">
                      <span className="text-base">{profile.name || 'Enter your name'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-lg font-medium">Location</Label>
                  {isEditing ? (
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="border-b border-muted-foreground bg-transparent border-x-0 border-t-0 rounded-none px-0"
                    />
                  ) : (
                    <div className="border-b border-muted-foreground pb-1">
                      <span className="text-base">{profile.location || 'Enter your location'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-lg font-medium">Skills Offered</Label>
                  {isEditing ? (
                    <SkillSelector
                      label=""
                      selectedSkills={skillsOffered}
                      onSkillsChange={setSkillsOffered}
                      placeholder="What skills can you teach?"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                      {skillsOffered.map((skill) => (
                        <Badge key={skill.id} variant="skill" className="text-xs">
                          {skill.name}
                        </Badge>
                      ))}
                      {skillsOffered.length === 0 && (
                        <span className="text-muted-foreground text-sm">No skills added</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-lg font-medium">Skills wanted</Label>
                  {isEditing ? (
                    <SkillSelector
                      label=""
                      selectedSkills={skillsWanted}
                      onSkillsChange={setSkillsWanted}
                      placeholder="What skills do you want to learn?"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                      {skillsWanted.map((skill) => (
                        <Badge key={skill.id} variant="outline" className="text-xs">
                          {skill.name}
                        </Badge>
                      ))}
                      {skillsWanted.length === 0 && (
                        <span className="text-muted-foreground text-sm">No skills added</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-lg font-medium">Availability</Label>
                  {isEditing ? (
                    <Select
                      value={profile.availability.join(',')}
                      onValueChange={(value) => setProfile({ ...profile, availability: value.split(',').filter(Boolean) })}
                    >
                      <SelectTrigger className="border-b border-muted-foreground bg-transparent border-x-0 border-t-0 rounded-none">
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekdays">Weekdays</SelectItem>
                        <SelectItem value="weekends">Weekends</SelectItem>
                        <SelectItem value="evenings">Evenings</SelectItem>
                        <SelectItem value="weekdays,weekends">Weekdays & Weekends</SelectItem>
                        <SelectItem value="weekdays,evenings">Weekdays & Evenings</SelectItem>
                        <SelectItem value="weekends,evenings">Weekends & Evenings</SelectItem>
                        <SelectItem value="weekdays,weekends,evenings">Anytime</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="border-b border-muted-foreground pb-1">
                      <span className="text-base">
                        {profile.availability.length > 0 ? profile.availability.join(', ') : 'Set your availability'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-lg font-medium">Profile</Label>
                  {isEditing ? (
                    <Select
                      value={profile.privacy_setting}
                      onValueChange={(value) => setProfile({ ...profile, privacy_setting: value })}
                    >
                      <SelectTrigger className="border-b border-muted-foreground bg-transparent border-x-0 border-t-0 rounded-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="border-b border-muted-foreground pb-1">
                      <span className="text-base capitalize">{profile.privacy_setting}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Profile Photo */}
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-32 w-32 ring-4 ring-primary/20">
                  <AvatarImage src={profile.profile_photo_url} alt={profile.name} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-bold">
                    {getInitials(profile.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                {isEditing ? (
                  <div className="text-center space-y-1">
                    <Input
                      value={profile.profile_photo_url}
                      onChange={(e) => setProfile({ ...profile, profile_photo_url: e.target.value })}
                      placeholder="Photo URL"
                      className="text-xs text-center"
                    />
                    <p className="text-xs text-muted-foreground">Add/Edit Photo</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">Profile Photo<br />Add/Edit Photo</p>
                )}
              </div>
            </div>

            {/* Edit Button - Only show when not in edit mode */}
            {!isEditing && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="px-8"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews Section */}
        {ratings.length > 0 && !isEditing && (
          <Card className="shadow-medium border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Reviews ({ratings.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ratings.slice(0, 3).map((rating, index) => (
                <div key={index} className="border-b border-border last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${
                            i < rating.rating ? 'fill-warning text-warning' : 'text-muted-foreground'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      by {(rating as any).profiles?.name || 'Anonymous'}
                    </span>
                  </div>
                  {rating.feedback && (
                    <p className="text-sm text-foreground">{rating.feedback}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Settings */}
        {!isEditing && (
          <Card className="shadow-medium border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                className="w-full"
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Navigation isAdmin={profile.is_admin} />
    </div>
  );
}