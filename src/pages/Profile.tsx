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
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Save, Edit3, User, Star, Settings, Loader2 } from 'lucide-react';
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

  const getAverageRating = () => {
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
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
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                My Profile
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your skills and preferences
              </p>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary hover:bg-primary-glow"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Profile Info Card */}
        <Card className="shadow-medium border-0">
          <CardHeader className="text-center">
            <Avatar className="h-20 w-20 mx-auto ring-4 ring-primary/20">
              <AvatarImage src={profile.profile_photo_url} alt={profile.name} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg font-bold">
                {getInitials(profile.name || 'U')}
              </AvatarFallback>
            </Avatar>
            {ratings.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="font-medium">{getAverageRating().toFixed(1)}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({ratings.length} reviews)
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="Enter your location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Profile Photo URL</Label>
                  <Input
                    id="photo"
                    value={profile.profile_photo_url}
                    onChange={(e) => setProfile({ ...profile, profile_photo_url: e.target.value })}
                    placeholder="Enter photo URL"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Availability</Label>
                  <Select
                    value={profile.availability.join(',')}
                    onValueChange={(value) => setProfile({ ...profile, availability: value.split(',').filter(Boolean) })}
                  >
                    <SelectTrigger>
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
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="privacy">Public Profile</Label>
                  <Switch
                    id="privacy"
                    checked={profile.privacy_setting === 'public'}
                    onCheckedChange={(checked) => 
                      setProfile({ ...profile, privacy_setting: checked ? 'public' : 'private' })
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <h3 className="font-display text-lg font-semibold">{profile.name}</h3>
                  {profile.location && (
                    <p className="text-muted-foreground">{profile.location}</p>
                  )}
                </div>

                {profile.availability.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Availability</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.availability.map((time) => (
                        <Badge key={time} variant="outline" className="text-xs">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Profile Status</span>
                  <Badge variant={profile.privacy_setting === 'public' ? 'success' : 'secondary'}>
                    {profile.privacy_setting === 'public' ? 'Public' : 'Private'}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Skills Section */}
        <Card className="shadow-medium border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <SkillSelector
                  label="Skills I Offer"
                  selectedSkills={skillsOffered}
                  onSkillsChange={setSkillsOffered}
                  placeholder="What skills can you teach?"
                />

                <SkillSelector
                  label="Skills I Want"
                  selectedSkills={skillsWanted}
                  onSkillsChange={setSkillsWanted}
                  placeholder="What skills do you want to learn?"
                />
              </>
            ) : (
              <>
                {skillsOffered.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Skills I Offer</p>
                    <div className="flex flex-wrap gap-2">
                      {skillsOffered.map((skill) => (
                        <Badge key={skill.id} variant="skill">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {skillsWanted.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Skills I Want</p>
                    <div className="flex flex-wrap gap-2">
                      {skillsWanted.map((skill) => (
                        <Badge key={skill.id} variant="outline">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {skillsOffered.length === 0 && skillsWanted.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No skills added yet. Click edit to add your skills.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Reviews Section */}
        {ratings.length > 0 && (
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
      </div>

      <Navigation isAdmin={profile.is_admin} />
    </div>
  );
}