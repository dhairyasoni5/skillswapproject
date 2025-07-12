import React from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ban, AlertTriangle } from 'lucide-react';

export default function Banned() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <Ban className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-xl text-red-600">Account Suspended</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-medium">Your account has been suspended</p>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Your account has been suspended due to a violation of our platform policies. 
            If you believe this is an error, please contact support.
          </p>
          
          <div className="pt-4">
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 