import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Skill {
  id: string;
  name: string;
  category?: string;
}

interface SkillSelectorProps {
  label: string;
  selectedSkills: Skill[];
  onSkillsChange: (skills: Skill[]) => void;
  placeholder?: string;
}

export const SkillSelector: React.FC<SkillSelectorProps> = ({
  label,
  selectedSkills,
  onSkillsChange,
  placeholder = "Type to search skills..."
}) => {
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);

  useEffect(() => {
    fetchSkills();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = availableSkills.filter(skill =>
        skill.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedSkills.some(selected => selected.id === skill.id)
      );
      setFilteredSkills(filtered);
    } else {
      setFilteredSkills([]);
    }
  }, [searchTerm, availableSkills, selectedSkills]);

  const fetchSkills = async () => {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('is_approved', true)
      .order('name');

    if (!error && data) {
      setAvailableSkills(data);
    }
  };

  const addSkill = (skill: Skill) => {
    if (!selectedSkills.some(s => s.id === skill.id)) {
      onSkillsChange([...selectedSkills, skill]);
      setSearchTerm('');
    }
  };

  const removeSkill = (skillId: string) => {
    onSkillsChange(selectedSkills.filter(skill => skill.id !== skillId));
  };

  const createNewSkill = async () => {
    if (!searchTerm.trim()) return;

    const { data, error } = await supabase
      .from('skills')
      .insert([{ name: searchTerm.trim(), is_approved: false }])
      .select()
      .single();

    if (!error && data) {
      const newSkill = data as Skill;
      addSkill(newSkill);
      setAvailableSkills([...availableSkills, newSkill]);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        
        {searchTerm && filteredSkills.length === 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:bg-primary/10"
            onClick={createNewSkill}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add "{searchTerm}"
          </Button>
        )}
      </div>

      {searchTerm && filteredSkills.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-2 max-h-32 overflow-y-auto">
          {filteredSkills.slice(0, 5).map((skill) => (
            <Button
              key={skill.id}
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start hover:bg-muted/50 text-left"
              onClick={() => addSkill(skill)}
            >
              {skill.name}
              {skill.category && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {skill.category}
                </span>
              )}
            </Button>
          ))}
        </div>
      )}

      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <Badge
              key={skill.id}
              variant="skill"
              className="flex items-center gap-1 px-3 py-1"
            >
              {skill.name}
              <button
                type="button"
                onClick={() => removeSkill(skill.id)}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};