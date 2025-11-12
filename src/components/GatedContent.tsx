"use client";

import React from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner"; // Import toast from sonner
import { isAdmin } from '@/lib/credits';

interface GatedContentProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

const GatedContent: React.FC<GatedContentProps> = ({ children, fallbackMessage = "Subscribe to unlock this content!" }) => {
  const { user, isLoading, isProfileLoading } = useSession();
  const navigate = useNavigate();

  if (isLoading || isProfileLoading) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8 bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Loading Content...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Checking subscription status...</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8 bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <p className="text-muted-foreground">Please log in to view this content.</p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </CardContent>
      </Card>
    );
  }

  if (isAdmin(user) || user.is_subscriber) {
    return <>{children}</>;
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8 bg-card text-card-foreground">
      <CardHeader>
        <CardTitle>Subscription Required</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <p className="text-lg font-medium text-muted-foreground">{fallbackMessage}</p>
        <Button onClick={() => toast.info("This would lead to a subscription page!")}> 
          Become a Subscriber
        </Button>
      </CardContent>
    </Card>
  );
};

export default GatedContent;
