import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Info, AlertCircle, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformMessage {
  id: string;
  title: string;
  message: string;
  message_type: 'info' | 'warning' | 'alert' | 'update';
  created_at: string;
}

export const PlatformMessages: React.FC = () => {
  const [messages, setMessages] = useState<PlatformMessage[]>([]);
  const [dismissedMessages, setDismissedMessages] = useState<string[]>([]);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('platform_messages')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMessages(data);
    }
  };

  const dismissMessage = (messageId: string) => {
    setDismissedMessages(prev => [...prev, messageId]);
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'update':
        return <Bell className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getMessageVariant = (type: string) => {
    switch (type) {
      case 'alert':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'update':
        return 'default';
      default:
        return 'default';
    }
  };

  const activeMessages = messages.filter(msg => !dismissedMessages.includes(msg.id));

  if (activeMessages.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      {activeMessages.map((message) => (
        <Card key={message.id} className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getMessageIcon(message.message_type)}
                <CardTitle className="text-lg">{message.title}</CardTitle>
                <Badge variant={getMessageVariant(message.message_type)}>
                  {message.message_type}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissMessage(message.id)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{message.message}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(message.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 