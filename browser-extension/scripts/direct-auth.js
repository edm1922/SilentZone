/**
 * Direct Authentication Helper
 * 
 * This module provides a simple, direct way to authenticate with the SilentZone web app.
 */

// Configuration
let config = {
  webAppUrl: 'http://localhost:9002', // Default URL of the SilentZone web app
};

// Try to load the web app URL from storage
chrome.storage.local.get(['webAppUrl'], (result) => {
  if (result.webAppUrl) {
    config.webAppUrl = result.webAppUrl;
    console.log('[SilentZone Auth] Loaded web app URL from storage:', config.webAppUrl);
  }
});

/**
 * Directly authenticate with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<boolean>} Whether authentication was successful
 */
async function directAuthenticate(email, password) {
  console.log('[SilentZone Auth] Attempting direct authentication with email:', email);
  
  try {
    // Generate a unique session ID for this login attempt
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    // Call the direct login API
    const loginUrl = `${config.webAppUrl}/api/auth/extension-login`;
    console.log('[SilentZone Auth] Direct login URL:', loginUrl);
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        sessionId
      })
    });
    
    console.log('[SilentZone Auth] Direct login response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('[SilentZone Auth] Direct login failed:', response.status, response.statusText);
      return false;
    }
    
    const data = await response.json();
    console.log('[SilentZone Auth] Direct login response data:', {
      success: data.success,
      hasToken: !!data.token,
      hasUser: !!data.user,
      userEmail: data.user ? data.user.email : 'none',
      hasRefreshToken: !!data.refresh_token,
      expiresAt: data.expires_at || 'none'
    });
    
    if (data.success && data.token && data.user) {
      // Store the auth token and user data
      console.log('[SilentZone Auth] Storing direct login token and user data');
      await chrome.storage.local.set({
        authToken: data.token,
        refreshToken: data.refresh_token,
        tokenExpiry: data.expires_at,
        user: data.user,
        // Store credentials for automatic re-authentication
        storedEmail: email,
        storedPassword: password
      });
      
      return true;
    } else {
      console.error('[SilentZone Auth] Failed to get valid direct login data:', data);
      return false;
    }
  } catch (error) {
    console.error('[SilentZone Auth] Failed to perform direct login:', error);
    return false;
  }
}

/**
 * Get the current authentication token
 * @returns {Promise<string|null>} The authentication token or null if not authenticated
 */
async function getAuthToken() {
  try {
    // Check if we have an auth token
    const authData = await chrome.storage.local.get(['authToken', 'refreshToken', 'tokenExpiry', 'user', 'storedEmail', 'storedPassword']);
    
    if (!authData.authToken) {
      console.log('[SilentZone Auth] No auth token found');
      
      // If we have stored credentials, try to authenticate
      if (authData.storedEmail && authData.storedPassword) {
        console.log('[SilentZone Auth] Found stored credentials, attempting to authenticate');
        const success = await directAuthenticate(authData.storedEmail, authData.storedPassword);
        
        if (success) {
          console.log('[SilentZone Auth] Successfully authenticated with stored credentials');
          
          // Get the new auth token
          const newAuthData = await chrome.storage.local.get(['authToken']);
          return newAuthData.authToken;
        } else {
          console.log('[SilentZone Auth] Failed to authenticate with stored credentials');
          return null;
        }
      }
      
      return null;
    }
    
    // Check if token is expired or about to expire (within 5 minutes)
    const now = Date.now();
    const tokenExpiry = authData.tokenExpiry ? new Date(authData.tokenExpiry).getTime() : 0;
    const isExpired = now >= tokenExpiry;
    const isAboutToExpire = now >= (tokenExpiry - 5 * 60 * 1000); // 5 minutes before expiry
    
    console.log('[SilentZone Auth] Token status:', {
      now: new Date(now).toISOString(),
      expiry: authData.tokenExpiry ? new Date(tokenExpiry).toISOString() : 'unknown',
      isExpired,
      isAboutToExpire
    });
    
    if (isExpired || isAboutToExpire) {
      // Token is expired or about to expire, try to refresh it
      console.log('[SilentZone Auth] Token is expired or about to expire, refreshing...');
      
      if (authData.refreshToken) {
        const refreshed = await refreshToken(authData.refreshToken);
        if (refreshed) {
          // Get the new auth token
          const newAuthData = await chrome.storage.local.get(['authToken']);
          return newAuthData.authToken;
        }
      }
      
      // If refresh failed or no refresh token, try direct login with stored credentials
      if (authData.storedEmail && authData.storedPassword) {
        console.log('[SilentZone Auth] Token refresh failed, trying direct login with stored credentials');
        const success = await directAuthenticate(authData.storedEmail, authData.storedPassword);
        
        if (success) {
          // Get the new auth token
          const newAuthData = await chrome.storage.local.get(['authToken']);
          return newAuthData.authToken;
        }
      }
      
      // If all else fails, return null
      return null;
    }
    
    // Token is still valid, return it
    return authData.authToken;
  } catch (error) {
    console.error('[SilentZone Auth] Error getting auth token:', error);
    return null;
  }
}

/**
 * Refresh the authentication token
 * @param {string} refreshTokenValue - The refresh token
 * @returns {Promise<boolean>} Whether the refresh was successful
 */
async function refreshToken(refreshTokenValue) {
  console.log('[SilentZone Auth] Refreshing authentication token...');
  
  try {
    // Generate a unique session ID for this refresh attempt
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    // Call the refresh token API
    const refreshUrl = `${config.webAppUrl}/api/auth/extension-refresh`;
    console.log('[SilentZone Auth] Refresh URL:', refreshUrl);
    
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshTokenValue,
        sessionId
      })
    });
    
    console.log('[SilentZone Auth] Refresh token response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('[SilentZone Auth] Failed to refresh token:', response.status, response.statusText);
      return false;
    }
    
    const data = await response.json();
    console.log('[SilentZone Auth] Refresh token response data:', {
      success: data.success,
      hasToken: !!data.token,
      hasUser: !!data.user,
      userEmail: data.user ? data.user.email : 'none',
      hasRefreshToken: !!data.refresh_token,
      expiresAt: data.expires_at || 'none'
    });
    
    if (data.success && data.token && data.user) {
      // Store the new auth token and user data
      console.log('[SilentZone Auth] Storing refreshed token and user data');
      await chrome.storage.local.set({
        authToken: data.token,
        refreshToken: data.refresh_token,
        tokenExpiry: data.expires_at,
        user: data.user,
      });
      
      return true;
    } else {
      console.error('[SilentZone Auth] Failed to get valid refresh token data:', data);
      return false;
    }
  } catch (error) {
    console.error('[SilentZone Auth] Failed to refresh token:', error);
    return false;
  }
}

// Export the functions
export { directAuthenticate, getAuthToken, refreshToken };
