'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseAuth } from '@/contexts/supabase-auth-context';

/**
 * Extension Connector Component
 * 
 * This component provides a button to directly connect the browser extension
 * by generating a connection token and storing it in local storage.
 */
export function ExtensionConnector() {
  const { toast } = useToast();
  const { session } = useSupabaseAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  const connectExtension = async () => {
    if (!session) {
      toast({
        title: 'Not logged in',
        description: 'You need to be logged in to connect the extension',
        variant: 'destructive',
      });
      return;
    }

    setIsConnecting(true);

    try {
      // Generate a unique connection ID
      const connectionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
      
      // Store the connection ID and token in localStorage
      localStorage.setItem('extensionConnectionId', connectionId);
      localStorage.setItem('extensionConnectionToken', session.access_token);
      localStorage.setItem('extensionConnectionTime', Date.now().toString());
      
      // Create the connection URL with the connection ID
      const extensionUrl = `silentzone-extension://${connectionId}`;
      
      toast({
        title: 'Extension Connection Ready',
        description: 'Click the extension icon to complete the connection',
      });
      
      // Try to open the extension URL
      try {
        window.location.href = extensionUrl;
      } catch (error) {
        console.error('Failed to open extension URL:', error);
      }
      
      // Create a simple API endpoint response with the token
      const response = await fetch('/api/extension-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to register extension connection');
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Extension Connection Registered',
          description: 'Your extension connection has been registered. Click the extension icon to complete the connection.',
        });
      }
    } catch (error) {
      console.error('Error connecting extension:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect the extension. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="mt-4">
      <Button 
        onClick={connectExtension} 
        disabled={isConnecting || !session}
        className="w-full"
        variant="outline"
      >
        {isConnecting ? 'Connecting...' : 'Connect Browser Extension'}
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Click this button to connect your browser extension to your account.
      </p>
    </div>
  );
}
