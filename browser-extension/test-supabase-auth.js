/**
 * Test script for direct Supabase authentication
 *
 * This script tests direct authentication with Supabase.
 * Run it with: node test-supabase-auth.js
 */

// Configuration
const config = {
  supabaseUrl: 'https://vepfwtiavznddkbhmrnw.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlcGZ3dGlhdnpuZGRrYmhtcm53Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjMzNDU3MywiZXhwIjoyMDYxOTEwNTczfQ.7hR25cT9Wpg-b3PvYAlP9r9bcn_QO12e9r65JHmxjoY',
  email: 'edronmaguale635@gmail.com',
  password: 'tripz0219'
};

/**
 * Directly authenticate with Supabase using email and password
 */
async function directAuthenticate(email, password) {
  console.log('[SilentZone Auth] Attempting direct authentication with email:', email);

  try {
    // Call the Supabase auth API directly
    const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.supabaseKey
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    console.log('[SilentZone Auth] Direct login response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('[SilentZone Auth] Direct login failed:', response.status, response.statusText);
      const errorData = await response.json();
      console.error('[SilentZone Auth] Error details:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('[SilentZone Auth] Direct login response data:', {
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      hasUser: !!data.user,
      userEmail: data.user ? data.user.email : 'none'
    });

    // Print the full user object for debugging
    console.log('[SilentZone Auth] User object:', JSON.stringify(data.user, null, 2));

    if (data.access_token && data.refresh_token && data.user) {
      console.log('[SilentZone Auth] Authentication successful!');
      console.log('[SilentZone Auth] Access token:', data.access_token.substring(0, 20) + '...');
      console.log('[SilentZone Auth] Refresh token:', data.refresh_token.substring(0, 10) + '...');
      console.log('[SilentZone Auth] Expires in:', data.expires_in, 'seconds');

      return true;
    } else {
      console.error('[SilentZone Auth] Failed to get valid direct login data');
      return false;
    }
  } catch (error) {
    console.error('[SilentZone Auth] Failed to perform direct login:', error);
    return false;
  }
}

/**
 * Run the test
 */
async function runTest() {
  console.log('=== Testing Direct Supabase Authentication ===');
  console.log('Config:', {
    supabaseUrl: config.supabaseUrl,
    email: config.email,
    password: '********' // Don't log the actual password
  });

  try {
    const success = await directAuthenticate(config.email, config.password);

    if (success) {
      console.log('\n✅ Direct Supabase authentication successful!');
    } else {
      console.log('\n❌ Direct Supabase authentication failed!');
    }
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Run the test
runTest();
