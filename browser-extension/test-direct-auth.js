/**
 * Test script for direct authentication
 * 
 * This script tests the direct authentication approach with the SilentZone web app.
 * Run it with: node test-direct-auth.js
 */

// Configuration
const config = {
  webAppUrl: 'http://localhost:9002',
  email: 'edronmaguale635@gmail.com',
  password: 'tripz0219'
};

// Mock Chrome API for testing
global.chrome = {
  storage: {
    local: {
      data: {},
      get: function(keys, callback) {
        console.log('Chrome storage get:', keys);
        const result = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            result[key] = this.data[key];
          });
        } else if (typeof keys === 'string') {
          result[keys] = this.data[keys];
        } else if (typeof keys === 'object') {
          Object.keys(keys).forEach(key => {
            result[key] = this.data[key] !== undefined ? this.data[key] : keys[key];
          });
        } else {
          Object.keys(this.data).forEach(key => {
            result[key] = this.data[key];
          });
        }
        callback(result);
      },
      set: function(items, callback) {
        console.log('Chrome storage set:', items);
        Object.keys(items).forEach(key => {
          this.data[key] = items[key];
        });
        if (callback) callback();
      },
      remove: function(keys, callback) {
        console.log('Chrome storage remove:', keys);
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            delete this.data[key];
          });
        } else {
          delete this.data[keys];
        }
        if (callback) callback();
      }
    }
  },
  runtime: {
    sendMessage: function(message) {
      console.log('Chrome runtime sendMessage:', message);
    }
  }
};

/**
 * Directly authenticate with email and password
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
      chrome.storage.local.set({
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
 * Run the test
 */
async function runTest() {
  console.log('=== Testing Direct Authentication ===');
  console.log('Config:', {
    webAppUrl: config.webAppUrl,
    email: config.email,
    password: '********' // Don't log the actual password
  });
  
  try {
    const success = await directAuthenticate(config.email, config.password);
    
    if (success) {
      console.log('\n✅ Direct authentication successful!');
      console.log('Stored data:', chrome.storage.local.data);
    } else {
      console.log('\n❌ Direct authentication failed!');
    }
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Run the test
runTest();
