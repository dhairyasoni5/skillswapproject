import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  category?: string;
}

interface Profile {
  id: string;
  name: string;
  location?: string;
  profile_photo_url?: string;
  rating?: number;
  skillsOffered: Skill[];
  skillsWanted: Skill[];
}

interface ProfileCardProps {
  profile: Profile;
  onRequest: (profileId: string) => void;
  showRequestButton?: boolean;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  onRequest, 
  showRequestButton = true 
}) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="group hover:shadow-medium transition-all duration-300 border-0 bg-card shadow-soft">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={profile.profile_photo_url} alt={profile.name} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground font-medium">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-display font-semibold text-foreground">{profile.name}</h3>
              {profile.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
          </div>
          
          {profile.rating && (
            <div className="flex items-center gap-1 bg-accent/50 px-2 py-1 rounded-full">
              <Star className="h-3 w-3 fill-warning text-warning" />
              <span className="text-xs font-medium">{profile.rating.toFixed(1)}/5</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {profile.skillsOffered.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Skills Offered</p>
              <div className="flex flex-wrap gap-1">
                {profile.skillsOffered.slice(0, 3).map((skill) => (
                  <Badge key={skill.id} variant="skill" className="text-xs">
                    {skill.name}
                  </Badge>
                ))}
                {profile.skillsOffered.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{profile.skillsOffered.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {profile.skillsWanted.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Skills Wanted</p>
              <div className="flex flex-wrap gap-1">
                {profile.skillsWanted.slice(0, 3).map((skill) => (
                  <Badge key={skill.id} variant="outline" className="text-xs">
                    {skill.name}
                  </Badge>
                ))}
                {profile.skillsWanted.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{profile.skillsWanted.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {showRequestButton && (
          <Button 
            onClick={() => onRequest(profile.id)}
            className="w-full mt-4 bg-primary hover:bg-primary-glow text-primary-foreground font-medium transition-all duration-200"
            size="sm"
          >
            Request Swap
          </Button>
        )}
      </CardContent>
    </Card>
  );
};