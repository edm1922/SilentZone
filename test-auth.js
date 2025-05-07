/**
 * Test script for SilentZone authentication
 *
 * This script tests the authentication flow between the web app and the extension.
 */

// Configuration
const config = {
  webAppUrl: 'http://localhost:9002',
};

// Mock storage for testing
const storage = {
  data: {},
  get: function(key) {
    return this.data[key] || null;
  },
  set: function(key, value) {
    this.data[key] = value;
    console.log(`Storage set: ${key} = ${JSON.stringify(value)}`);
  },
  remove: function(key) {
    delete this.data[key];
    console.log(`Storage removed: ${key}`);
  }
};

/**
 * Test direct login
 */
async function testDirectLogin(email, password) {
  console.log(`\n=== Testing Direct Login with ${email} ===`);

  try {
    // Generate a unique session ID for this login attempt
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);

    // Call the direct login API
    const loginUrl = `${config.webAppUrl}/api/auth/extension-login`;
    console.log(`Direct login URL: ${loginUrl}`);

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

    console.log(`Direct login response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`Direct login failed: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    console.log(`Direct login response data:`, {
      success: data.success,
      hasToken: !!data.token,
      hasUser: !!data.user,
      userEmail: data.user ? data.user.email : 'none',
      hasRefreshToken: !!data.refresh_token,
      expiresAt: data.expires_at || 'none'
    });

    if (data.success && data.token && data.user) {
      // Store the auth token and user data
      console.log(`Storing direct login token and user data`);
      storage.set('authToken', data.token);
      storage.set('refreshToken', data.refresh_token);
      storage.set('tokenExpiry', data.expires_at);
      storage.set('user', data.user);

      return true;
    } else {
      console.error(`Failed to get valid direct login data:`, data);
      return false;
    }
  } catch (error) {
    console.error(`Failed to perform direct login:`, error);
    return false;
  }
}

/**
 * Test token refresh
 */
async function testTokenRefresh(refreshToken) {
  console.log(`\n=== Testing Token Refresh ===`);

  try {
    // Generate a unique session ID for this refresh attempt
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);

    // Call the refresh token API
    const refreshUrl = `${config.webAppUrl}/api/auth/extension-refresh`;
    console.log(`Refresh URL: ${refreshUrl}`);

    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
        sessionId
      })
    });

    console.log(`Refresh token response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`Failed to refresh token: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    console.log(`Refresh token response data:`, {
      success: data.success,
      hasToken: !!data.token,
      hasUser: !!data.user,
      userEmail: data.user ? data.user.email : 'none',
      hasRefreshToken: !!data.refresh_token,
      expiresAt: data.expires_at || 'none'
    });

    if (data.success && data.token && data.user) {
      // Store the new auth token and user data
      console.log(`Storing refreshed token and user data`);
      storage.set('authToken', data.token);
      storage.set('refreshToken', data.refresh_token);
      storage.set('tokenExpiry', data.expires_at);
      storage.set('user', data.user);

      return true;
    } else {
      console.error(`Failed to get valid refresh token data:`, data);
      return false;
    }
  } catch (error) {
    console.error(`Failed to refresh token:`, error);
    return false;
  }
}

/**
 * Test extension token
 */
async function testExtensionToken(sessionId) {
  console.log(`\n=== Testing Extension Token ===`);

  try {
    // Call the extension token API
    const tokenUrl = `${config.webAppUrl}/api/auth/extension-token?sessionId=${sessionId}&timestamp=${Date.now()}`;
    console.log(`Extension token URL: ${tokenUrl}`);

    const response = await fetch(tokenUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(`Extension token response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`Failed to get extension token: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    console.log(`Extension token response data:`, {
      success: data.success,
      hasToken: !!data.token,
      hasUser: !!data.user,
      userEmail: data.user ? data.user.email : 'none',
      hasRefreshToken: !!data.refresh_token,
      expiresAt: data.expires_at || 'none'
    });

    if (data.success && data.token && data.user) {
      // Store the auth token and user data
      console.log(`Storing extension token and user data`);
      storage.set('authToken', data.token);
      storage.set('refreshToken', data.refresh_token);
      storage.set('tokenExpiry', data.expires_at);
      storage.set('user', data.user);

      return true;
    } else {
      console.error(`Failed to get valid extension token data:`, data);
      return false;
    }
  } catch (error) {
    console.error(`Failed to get extension token:`, error);
    return false;
  }
}

/**
 * Run the tests
 */
async function runTests() {
  // Test direct login
  const email = 'edronmaguale635@gmail.com';
  const password = 'tripz0219';

  const loginSuccess = await testDirectLogin(email, password);

  if (loginSuccess) {
    console.log(`\n✅ Direct login successful!`);

    // Test token refresh
    const refreshToken = storage.get('refreshToken');
    if (refreshToken) {
      const refreshSuccess = await testTokenRefresh(refreshToken);

      if (refreshSuccess) {
        console.log(`\n✅ Token refresh successful!`);
      } else {
        console.log(`\n❌ Token refresh failed!`);
      }
    }

    // Test extension token
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const tokenSuccess = await testExtensionToken(sessionId);

    if (tokenSuccess) {
      console.log(`\n✅ Extension token successful!`);
    } else {
      console.log(`\n❌ Extension token failed!`);
    }
  } else {
    console.log(`\n❌ Direct login failed!`);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});
