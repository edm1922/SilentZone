/**
 * Authentication helper functions for the background script
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
 * Check if the token is valid and refresh it if needed
 * @returns {Promise<string|null>} The valid token or null if authentication failed
 */
async function ensureValidToken() {
  try {
    // Get auth data from storage
    const authData = await chrome.storage.local.get(['authToken', 'refreshToken', 'tokenExpiry', 'user']);
    const { authToken, refreshToken, tokenExpiry, user } = authData;

    // If we don't have a token or user, return null
    if (!authToken || !user) {
      console.log('[SilentZone Auth] No auth token or user found');
      return null;
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const now = Date.now();
    const expiryTime = tokenExpiry ? new Date(tokenExpiry).getTime() : 0;
    const isExpired = now >= expiryTime;
    const isAboutToExpire = now >= (expiryTime - 5 * 60 * 1000); // 5 minutes before expiry

    console.log('[SilentZone Auth] Token status:', {
      now: new Date(now).toISOString(),
      expiry: tokenExpiry ? new Date(expiryTime).toISOString() : 'unknown',
      isExpired,
      isAboutToExpire
    });

    // If token is still valid, return it
    if (!isExpired && !isAboutToExpire) {
      console.log('[SilentZone Auth] Token is still valid');
      return authToken;
    }

    // Token is expired or about to expire, try to refresh it
    console.log('[SilentZone Auth] Token is expired or about to expire, refreshing...');

    // If we don't have a refresh token, try direct login
    if (!refreshToken) {
      console.log('[SilentZone Auth] No refresh token found, trying direct login');
      return await tryDirectLogin();
    }

    // Try to refresh the token
    const refreshed = await refreshToken(refreshToken);
    if (refreshed) {
      // Get the new token from storage
      const newAuthData = await chrome.storage.local.get(['authToken']);
      console.log('[SilentZone Auth] Token refreshed successfully');
      return newAuthData.authToken;
    }

    // If refresh failed, try direct login
    console.log('[SilentZone Auth] Token refresh failed, trying direct login');
    return await tryDirectLogin();
  } catch (error) {
    console.error('[SilentZone Auth] Error ensuring valid token:', error);
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

/**
 * Try direct login with stored credentials
 * @returns {Promise<string|null>} The new token or null if login failed
 */
async function tryDirectLogin() {
  console.log('[SilentZone Auth] Attempting direct login as fallback...');

  try {
    // Check if we have stored credentials
    const credentials = await chrome.storage.local.get(['storedEmail', 'storedPassword']);

    if (!credentials.storedEmail || !credentials.storedPassword) {
      console.log('[SilentZone Auth] No stored credentials found for direct login');
      return null;
    }

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
        email: credentials.storedEmail,
        password: credentials.storedPassword,
        sessionId
      })
    });

    console.log('[SilentZone Auth] Direct login response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('[SilentZone Auth] Direct login failed:', response.status, response.statusText);
      return null;
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
      // Store the new auth token and user data
      console.log('[SilentZone Auth] Storing direct login token and user data');
      await chrome.storage.local.set({
        authToken: data.token,
        refreshToken: data.refresh_token,
        tokenExpiry: data.expires_at,
        user: data.user,
      });

      return data.token;
    } else {
      console.error('[SilentZone Auth] Failed to get valid direct login data:', data);
      return null;
    }
  } catch (error) {
    console.error('[SilentZone Auth] Failed to perform direct login:', error);
    return null;
  }
}

// Export the functions
export { ensureValidToken };
