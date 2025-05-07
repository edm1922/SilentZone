'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseAuth } from '@/contexts/supabase-auth-context';

/**
 * This component handles authentication for the browser extension.
 * It detects when the page is loaded with the extensionAuth parameter
 * and automatically triggers the extension token API.
 */
export function ExtensionAuthHandler() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, session } = useSupabaseAuth();
  const [processed, setProcessed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const extensionAuth = searchParams.get('extensionAuth');
    const sessionId = searchParams.get('sessionId');

    if (extensionAuth === 'true' && !processed && user && session) {
      console.log('Extension auth detected with authenticated user:', user.email);
      setProcessed(true);
      handleExtensionAuth(session.access_token, sessionId);
    } else if (extensionAuth === 'true' && !processed && retryCount < 10) {
      // If we don't have a user yet, retry a few more times
      const timer = setTimeout(() => {
        console.log(`Extension auth detected, but no user yet. Retrying... (${retryCount + 1}/10)`);
        setRetryCount(retryCount + 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, processed, user, session, retryCount]);

  const handleExtensionAuth = async (accessToken: string, sessionId?: string | null) => {
    try {
      console.log('Extension auth detected, generating extension token');
      console.log('Session ID:', sessionId || 'none');

      if (!sessionId) {
        console.error('No session ID provided for extension auth');
        throw new Error('No session ID provided');
      }

      // Call the extension token API with the session ID
      const getUrl = `/api/auth/extension-token?sessionId=${encodeURIComponent(sessionId)}&timestamp=${Date.now()}`;
      console.log('Calling extension token API:', getUrl);

      const response = await fetch(getUrl, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Failed to generate extension token, status:', response.status);
        throw new Error('Failed to generate extension token');
      }

      const data = await response.json();

      if (data.success) {
        console.log('Extension token generated successfully');
        showSuccessToast();
      } else {
        throw new Error(data.error || 'Failed to generate extension token');
      }
    } catch (error) {
      console.error('Error generating extension token:', error);

      toast({
        title: 'Extension Connection Failed',
        description: 'Failed to connect your browser extension. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const showSuccessToast = () => {
    toast({
      title: 'Extension Connected',
      description: 'Your browser extension has been connected to your account.',
      duration: 3000,
    });
  };

  // This component doesn't render anything
  return null;
}
