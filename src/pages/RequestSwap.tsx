import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  category?: string;
}

interface Profile {
  id: string;
  user_id: string;
  name: string;
  location?: string;
  profile_photo_url?: string;
  skillsOffered: Skill[];
  skillsWanted: Skill[];
  averageRating?: number;
}

const RequestSwap = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [selectedOfferedSkill, setSelectedOfferedSkill] = useState<string>("");
  const [selectedWantedSkill, setSelectedWantedSkill] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !profileId) {
      navigate("/auth");
      return;
    }
    fetchProfileData();
    fetchUserSkills();
  }, [user, profileId]);

  const fetchProfileData = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError) throw profileError;

      // Fetch skills offered and wanted
      const { data: skillsData, error: skillsError } = await supabase
        .from('user_skills')
        .select(`
          skill_type,
          skills (id, name, category)
        `)
        .eq('user_id', profileData.user_id);

      if (skillsError) throw skillsError;

      const skillsOffered = skillsData
        .filter(item => item.skill_type === 'offered')
        .map(item => item.skills);
      const skillsWanted = skillsData
        .filter(item => item.skill_type === 'wanted')
        .map(item => item.skills);

      setProfile({
        ...profileData,
        skillsOffered,
        skillsWanted
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSkills = async () => {
    try {
      const { data: skillsData, error } = await supabase
        .from('user_skills')
        .select(`
          skills (id, name, category)
        `)
        .eq('user_id', user?.id)
        .eq('skill_type', 'offered');

      if (error) throw error;

      setUserSkills(skillsData.map(item => item.skills));
    } catch (error) {
      console.error('Error fetching user skills:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOfferedSkill || !selectedWantedSkill) {
      toast({
        title: "Error",
        description: "Please select both skills",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('swap_requests')
        .insert({
          requester_id: user?.id,
          recipient_id: profile?.user_id,
          offered_skill_id: selectedOfferedSkill,
          wanted_skill_id: selectedWantedSkill,
          message: message || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Swap request sent successfully!",
      });

      navigate("/");
    } catch (error) {
      console.error('Error sending swap request:', error);
      toast({
        title: "Error",
        description: "Failed to send swap request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">Skill Swap Platform</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Request</span>
            <Button variant="outline" onClick={() => navigate("/")}>
              Home
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Request Form */}
          <Card>
            <CardHeader>
              <CardTitle>Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Choose one of your offered skills
                </label>
                <Select value={selectedOfferedSkill} onValueChange={setSelectedOfferedSkill}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill you offer" />
                  </SelectTrigger>
                  <SelectContent>
                    {userSkills.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Choose one of their wanted skills
                </label>
                <Select value={selectedWantedSkill} onValueChange={setSelectedWantedSkill}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill they want" />
                  </SelectTrigger>
                  <SelectContent>
                    {profile.skillsWanted.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Message
                </label>
                <Textarea
                  placeholder="Add a message (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || !selectedOfferedSkill || !selectedWantedSkill}
                className="w-full"
              >
                {submitting ? "Sending..." : "Submit"}
              </Button>
            </CardContent>
          </Card>

          {/* Profile Display */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Avatar className="w-32 h-32 mx-auto">
                  <AvatarImage src={profile.profile_photo_url} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>

                <h2 className="text-2xl font-semibold">{profile.name}</h2>
                {profile.location && (
                  <p className="text-muted-foreground">{profile.location}</p>
                )}

                <div className="space-y-4 text-left">
                  <div>
                    <h3 className="font-medium text-lg mb-2">Skills Offered</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skillsOffered.map((skill) => (
                        <span
                          key={skill.id}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-lg mb-2">Skills Wanted</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skillsWanted.map((skill) => (
                        <span
                          key={skill.id}
                          className="px-3 py-1 bg-secondary/50 text-secondary-foreground rounded-full text-sm"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-lg mb-2">Rating and Feedback</h3>
                    <div className="text-center">
                      {profile.averageRating ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl">⭐</span>
                          <span className="text-lg font-medium">
                            {profile.averageRating.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No ratings yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RequestSwap;