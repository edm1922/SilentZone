'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabase } from '@/app/supabase-provider';

/**
 * ExtensionAuth component
 * 
 * This component is used to handle authentication for the browser extension.
 * It detects when the extension is trying to authenticate and sends the token
 * to the extension via a dedicated API endpoint.
 */
export default function ExtensionAuth() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { supabase } = useSupabase();
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    // Check if this is an extension auth request
    const extensionAuth = searchParams.get('extensionAuth');
    const sessionId = searchParams.get('sessionId');
    const timestamp = searchParams.get('timestamp');

    if (extensionAuth === 'true' && sessionId) {
      console.log('Extension auth detected with session ID:', sessionId);
      setStatus('processing');
      setMessage('Authenticating extension...');

      // Function to send the token to the extension
      const sendTokenToExtension = async () => {
        try {
          // Get the current session
          const { data: { session } } = await supabase.auth.getSession();

          if (!session) {
            console.log('No active session found');
            setStatus('error');
            setMessage('No active session found. Please sign in first.');
            return;
          }

          console.log('Session found, sending token to extension');

          // Send the token to the extension via the API
          const response = await fetch(`/api/auth/extension-token?sessionId=${sessionId}&timestamp=${Date.now()}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error(`Failed to send token to extension: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();

          if (data.success) {
            console.log('Token sent to extension successfully');
            setStatus('success');
            setMessage('Authentication successful! You can close this tab and return to the extension.');

            // Redirect to dashboard after a short delay
            setTimeout(() => {
              router.push('/dashboard');
            }, 3000);
          } else {
            console.error('Failed to send token to extension:', data.error);
            setStatus('error');
            setMessage(`Failed to authenticate extension: ${data.error}`);
          }
        } catch (error) {
          console.error('Error sending token to extension:', error);
          setStatus('error');
          setMessage(`Error authenticating extension: ${error.message}`);
        }
      };

      // Wait a bit to ensure the session is established
      setTimeout(sendTokenToExtension, 1000);
    }
  }, [searchParams, supabase, router]);

  // If not an extension auth request, don't render anything
  if (status === 'idle') {
    return null;
  }

  // Render a message for the user
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">
          {status === 'processing' ? 'Extension Authentication' : 
           status === 'success' ? 'Authentication Successful' : 'Authentication Error'}
        </h2>
        
        <p className="mb-4">{message}</p>
        
        {status === 'processing' && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-center text-green-600">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center text-red-600">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <button 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => router.push('/login')}
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
