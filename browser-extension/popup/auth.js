/**
 * SilentZone Extension Authentication
 *
 * This script handles authentication with the SilentZone web app
 */

// DOM Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const authSection = document.getElementById('auth-section');
const contentSection = document.getElementById('content-section');

// Configuration
const config = {
  webAppUrl: 'http://localhost:9002', // Default URL of the SilentZone web app
};

// Try to load the web app URL from storage
chrome.storage.local.get(['webAppUrl'], (result) => {
  if (result.webAppUrl) {
    config.webAppUrl = result.webAppUrl;
    console.log('[SilentZone Auth] Loaded web app URL from storage:', config.webAppUrl);
  } else {
    // Store the default URL
    chrome.storage.local.set({ webAppUrl: config.webAppUrl });
    console.log('[SilentZone Auth] Using default web app URL:', config.webAppUrl);
  }
});

// Initialize authentication
initAuth();

/**
 * Initialize authentication
 */
async function initAuth() {
  console.log('[SilentZone Auth] Initializing authentication...');

  // Check if we have an auth token
  const authData = await chrome.storage.local.get(['authToken', 'user', 'refreshToken', 'tokenExpiry']);
  console.log('[SilentZone Auth] Auth data:', {
    hasToken: !!authData.authToken,
    hasUser: !!authData.user,
    userEmail: authData.user ? authData.user.email : 'none',
    hasRefreshToken: !!authData.refreshToken,
    tokenExpiry: authData.tokenExpiry || 'none'
  });

  if (authData.authToken && authData.user) {
    // Check if token is expired or about to expire (within 5 minutes)
    const now = Date.now();
    const tokenExpiry = authData.tokenExpiry ? new Date(authData.tokenExpiry).getTime() : 0;
    const isExpired = now >= tokenExpiry;
    const isAboutToExpire = now >= (tokenExpiry - 5 * 60 * 1000); // 5 minutes before expiry

    console.log('[SilentZone Auth] Token status:', {
      now: new Date(now).toISOString(),
      expiry: new Date(tokenExpiry).toISOString(),
      isExpired,
      isAboutToExpire
    });

    if (isExpired || isAboutToExpire) {
      // Token is expired or about to expire, try to refresh it
      console.log('[SilentZone Auth] Token is expired or about to expire, refreshing...');

      if (authData.refreshToken) {
        const refreshed = await refreshToken(authData.refreshToken);
        if (refreshed) {
          // Token refreshed successfully, show logged in state
          console.log('[SilentZone Auth] Token refreshed successfully');

          // Get the updated auth data
          const updatedAuthData = await chrome.storage.local.get(['authToken', 'user']);
          showLoggedInState(updatedAuthData.user);
        } else {
          // Failed to refresh token, show login form
          console.log('[SilentZone Auth] Failed to refresh token, showing login form');
          showLoginForm();
        }
      } else {
        // No refresh token, show login form
        console.log('[SilentZone Auth] No refresh token available, showing login form');
        showLoginForm();
      }
    } else {
      // Token is still valid, show the content section
      console.log('[SilentZone Auth] User is authenticated with valid token, showing logged in state');
      showLoggedInState(authData.user);
    }
  } else {
    // No auth token, show the login form
    console.log('[SilentZone Auth] User is not authenticated, showing login form');
    showLoginForm();
  }

  // Set up event listeners
  setupEventListeners();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Web App Login button
  const webAppLoginBtn = document.getElementById('webAppLoginBtn');
  if (webAppLoginBtn) {
    webAppLoginBtn.addEventListener('click', handleWebAppLogin);
  }

  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Open signup link
  const openSignupBtn = document.getElementById('openSignupBtn');
  if (openSignupBtn) {
    openSignupBtn.addEventListener('click', function(e) {
      e.preventDefault();
      chrome.tabs.create({ url: `${config.webAppUrl}/signup` });
    });
  }
}

/**
 * Handle Web App Login button click
 */
async function handleWebAppLogin() {
  console.log('[SilentZone Auth] Opening web app for login...');

  try {
    // Generate a unique session ID for this login attempt
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);

    // Store the session ID for later verification
    await chrome.storage.local.set({ pendingAuthSessionId: sessionId });

    // Create a new tab to the web app login page with the extension auth parameter
    const loginUrl = `${config.webAppUrl}/login?extensionAuth=true&sessionId=${sessionId}&timestamp=${Date.now()}`;
    console.log('[SilentZone Auth] Opening login URL:', loginUrl);

    chrome.tabs.create({ url: loginUrl });

    // Show a message to the user
    showLoginError('Please complete login in the opened tab. This popup will update automatically when you\'re logged in.');

    // Start checking for authentication in the background
    chrome.runtime.sendMessage({
      action: 'startAuthCheck',
      sessionId: sessionId
    });
  } catch (error) {
    console.error('[SilentZone Auth] Error opening web app login:', error);
    showLoginError('Failed to open web app. Please try again.');
  }
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
  event.preventDefault();

  // Get form values
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Validate form
  if (!email || !password) {
    showLoginError('Please enter both email and password');
    return;
  }

  // Show loading state
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';
  hideLoginError();

  try {
    console.log('[SilentZone Auth] Attempting to login with email:', email);

    // Store credentials for direct login fallback
    console.log('[SilentZone Auth] Storing credentials for direct login fallback');
    await chrome.storage.local.set({
      storedEmail: email,
      storedPassword: password
    });

    // Try direct login first
    console.log('[SilentZone Auth] Trying direct login...');
    const directLoginSuccess = await directLogin(email, password);

    if (directLoginSuccess) {
      console.log('[SilentZone Auth] Direct login successful');
      return;
    }

    // If direct login fails, fall back to web app login
    console.log('[SilentZone Auth] Direct login failed, falling back to web app login');

    // Create a new tab to the web app login page
    console.log('[SilentZone Auth] Opening web app login page in a new tab');
    const loginTab = await chrome.tabs.create({
      url: `${config.webAppUrl}/login?extensionAuth=true&email=${encodeURIComponent(email)}&timestamp=${Date.now()}`,
      active: true
    });

    // Wait for the user to log in through the web app
    console.log('[SilentZone Auth] Waiting for user to log in through the web app...');

    // Show a message to the user
    showLoginError('Please complete login in the opened tab. This popup will update automatically when you\'re logged in.');

    // Set up a listener for when the tab URL changes to the dashboard
    const checkLoginStatus = async () => {
      try {
        // Try to get the extension token
        console.log('[SilentZone Auth] Checking if user is logged in...');
        const success = await getExtensionToken();

        if (success) {
          console.log('[SilentZone Auth] User successfully logged in and token retrieved');
          // Close the login tab
          chrome.tabs.remove(loginTab.id);
          return true;
        }

        // If not successful, check again in 2 seconds
        setTimeout(checkLoginStatus, 2000);
        return false;
      } catch (error) {
        console.error('[SilentZone Auth] Error checking login status:', error);
        setTimeout(checkLoginStatus, 2000);
        return false;
      }
    };

    // Start checking login status
    setTimeout(checkLoginStatus, 3000);

  } catch (error) {
    console.error('[SilentZone Auth] Login failed:', error);
    showLoginError(error.message || 'Login failed. Please try again.');

    // Reset form state
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign in';
  }
}

/**
 * Get an extension token after successful login
 */
async function getExtensionToken() {
  console.log('[SilentZone Auth] Getting extension token...');

  try {
    // Create a new tab to the web app dashboard with extension auth parameter
    console.log('[SilentZone Auth] Opening web app dashboard to establish session');

    // Generate a unique session ID to track this auth attempt
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);

    const dashboardUrl = `${config.webAppUrl}/dashboard?extensionAuth=true&sessionId=${sessionId}&timestamp=${Date.now()}`;
    console.log('[SilentZone Auth] Dashboard URL:', dashboardUrl);

    const tab = await chrome.tabs.create({
      url: dashboardUrl,
      active: true
    });

    // Wait for the tab to load and the user to authenticate
    console.log('[SilentZone Auth] Waiting for authentication in web app...');

    // Set up a message listener for direct communication from the web page
    const tokenPromise = new Promise((resolve, reject) => {
      // Set a timeout to prevent waiting forever
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for authentication'));
      }, 60000); // 1 minute timeout

      // Function to check for token
      const checkForToken = async () => {
        try {
          // Try to get the token with direct API call
          const tokenUrl = `${config.webAppUrl}/api/auth/extension-token?sessionId=${sessionId}&timestamp=${Date.now()}`;
          console.log('[SilentZone Auth] Checking for token:', tokenUrl);

          const response = await fetch(tokenUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.token && data.user) {
              clearTimeout(timeout);
              resolve(data);
              return true;
            }
          }

          // If we didn't get a token, check again in 2 seconds
          setTimeout(checkForToken, 2000);
          return false;
        } catch (error) {
          console.error('[SilentZone Auth] Error checking for token:', error);
          setTimeout(checkForToken, 2000);
          return false;
        }
      };

      // Start checking for token
      checkForToken();
    });

    // Wait for the token
    const data = await tokenPromise;

    // Close the tab we opened
    try {
      chrome.tabs.remove(tab.id);
    } catch (error) {
      console.error('[SilentZone Auth] Error closing tab:', error);
    }

    console.log('[SilentZone Auth] Received token data:', {
      success: data.success,
      hasToken: !!data.token,
      hasUser: !!data.user,
      userEmail: data.user ? data.user.email : 'none'
    });

    // Store auth token, refresh token, expiry, and user data
    console.log('[SilentZone Auth] Storing extension token and user data');
    await chrome.storage.local.set({
      authToken: data.token,
      refreshToken: data.refresh_token,
      tokenExpiry: data.expires_at,
      user: data.user,
    });

    // Show logged in state
    showLoggedInState(data.user);

    // Trigger sync with web app
    console.log('[SilentZone Auth] Triggering sync with web app after getting extension token');
    chrome.runtime.sendMessage({ action: 'syncNow' });

    // Force a full sync to ensure all data is up to date
    console.log('[SilentZone Auth] Forcing full sync with web app');
    chrome.runtime.sendMessage({ action: 'forceFullSync' });

    // Return success
    return true;
  } catch (error) {
    console.error('[SilentZone Auth] Failed to get extension token:', error);
    showLoginError(error.message || 'Authentication failed. Please try again.');
    return false;
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  // Clear auth data
  await chrome.storage.local.remove(['authToken', 'user']);

  // Show login form
  showLoginForm();

  // Clear form fields
  if (emailInput) emailInput.value = '';
  if (passwordInput) passwordInput.value = '';
}

/**
 * Show logged in state
 */
function showLoggedInState(user) {
  if (authSection) authSection.classList.add('hidden');
  if (contentSection) contentSection.classList.remove('hidden');

  // Update UI with user info
  const userInfo = document.getElementById('user-info');
  if (userInfo) {
    userInfo.textContent = `Signed in as ${user.email}`;
  }
}

/**
 * Show login form
 */
function showLoginForm() {
  if (authSection) authSection.classList.remove('hidden');
  if (contentSection) contentSection.classList.add('hidden');
}

/**
 * Show login error
 */
function showLoginError(message) {
  if (loginError) {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
  }
}

/**
 * Hide login error
 */
function hideLoginError() {
  if (loginError) {
    loginError.classList.add('hidden');
  }
}

/**
 * Show token expired message
 */
function showTokenExpiredMessage(message) {
  const tokenExpiredMessage = document.getElementById('token-expired-message');
  if (tokenExpiredMessage) {
    tokenExpiredMessage.textContent = message || 'Your session has expired. Please sign in again.';
    tokenExpiredMessage.classList.remove('hidden');
  }

  // Also show the login form
  showLoginForm();
}

/**
 * Refresh the authentication token
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

      // If refresh fails, try direct login as fallback
      console.log('[SilentZone Auth] Trying direct login as fallback...');
      return await tryDirectLogin();
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

      // Trigger sync with web app
      console.log('[SilentZone Auth] Triggering sync with web app after refreshing token');
      chrome.runtime.sendMessage({ action: 'syncNow' });

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
 * Direct login with provided credentials
 */
async function directLogin(email, password) {
  console.log('[SilentZone Auth] Attempting direct login...');

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
      // Store the new auth token and user data
      console.log('[SilentZone Auth] Storing direct login token and user data');
      await chrome.storage.local.set({
        authToken: data.token,
        refreshToken: data.refresh_token,
        tokenExpiry: data.expires_at,
        user: data.user,
      });

      // Show logged in state
      showLoggedInState(data.user);

      // Reset form state
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign in';

      // Trigger sync with web app
      console.log('[SilentZone Auth] Triggering sync with web app after direct login');
      chrome.runtime.sendMessage({ action: 'syncNow' });

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
 * Check authentication status
 * This is used to refresh the UI after authentication completes
 */
async function checkAuthStatus() {
  console.log('[SilentZone Auth] Checking authentication status...');

  // Check if we have an auth token
  const authData = await chrome.storage.local.get(['authToken', 'user', 'refreshToken', 'tokenExpiry']);

  if (authData.authToken && authData.user) {
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
          // Token refreshed successfully, show logged in state
          console.log('[SilentZone Auth] Token refreshed successfully');

          // Get the updated auth data
          const updatedAuthData = await chrome.storage.local.get(['authToken', 'user']);
          showLoggedInState(updatedAuthData.user);

          // Trigger sync with web app
          console.log('[SilentZone Auth] Triggering sync with web app after token refresh');
          chrome.runtime.sendMessage({ action: 'syncNow' });
          return;
        }
      }

      // If refresh failed or no refresh token, try direct login
      console.log('[SilentZone Auth] Token refresh failed or no refresh token, trying direct login');
      const directLoginSuccess = await tryDirectLogin();

      if (directLoginSuccess) {
        console.log('[SilentZone Auth] Direct login successful');

        // Get the updated auth data
        const updatedAuthData = await chrome.storage.local.get(['authToken', 'user']);
        showLoggedInState(updatedAuthData.user);

        // Trigger sync with web app
        console.log('[SilentZone Auth] Triggering sync with web app after direct login');
        chrome.runtime.sendMessage({ action: 'syncNow' });
        return;
      }

      // If direct login failed, show login form
      console.log('[SilentZone Auth] Direct login failed, showing login form');
      showLoginForm();
    } else {
      // Token is still valid, show logged in state
      console.log('[SilentZone Auth] User is authenticated with valid token, showing logged in state');
      showLoggedInState(authData.user);

      // Trigger sync with web app
      console.log('[SilentZone Auth] Triggering sync with web app after authentication check');
      chrome.runtime.sendMessage({ action: 'syncNow' });
    }
  } else {
    // User is not authenticated, show login form
    console.log('[SilentZone Auth] User is not authenticated, showing login form');
    showLoginForm();
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message) => {
  console.log('[SilentZone Auth] Received message:', message);

  if (message.action === 'authError') {
    // Show the auth error message
    console.log('[SilentZone Auth] Auth error:', message.error);
    showTokenExpiredMessage(message.error);
  } else if (message.action === 'authComplete') {
    if (message.success) {
      // Authentication completed successfully, refresh the popup
      console.log('[SilentZone Auth] Authentication completed successfully');
      checkAuthStatus();
    } else {
      // Authentication failed, show error
      console.error('[SilentZone Auth] Authentication failed:', message.error);
      showLoginError(message.error || 'Authentication failed. Please try again.');
    }
  }
});

/**
 * Try direct login with email and password
 * @param {string} email - The user's email
 * @param {string} password - The user's password
 * @returns {Promise<boolean>} Whether the login was successful
 */
async function directLogin(email, password) {
  console.log('[SilentZone Auth] Attempting direct login with email:', email);

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
      });

      // Show logged in state
      showLoggedInState(data.user);

      // Reset form state
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign in';
      }

      // Trigger sync with web app
      console.log('[SilentZone Auth] Triggering sync with web app after direct login');
      chrome.runtime.sendMessage({ action: 'syncNow' });

      // Force a full sync to ensure all data is up to date
      console.log('[SilentZone Auth] Forcing full sync with web app');
      chrome.runtime.sendMessage({ action: 'forceFullSync' });

      return true;
    } else {
      console.error('[SilentZone Auth] Failed to get valid direct login data:', data);

      // Reset form state
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign in';
      }

      return false;
    }
  } catch (error) {
    console.error('[SilentZone Auth] Failed to perform direct login:', error);

    // Reset form state
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign in';
    }

    return false;
  }
}

/**
 * Try direct login with stored credentials
 * This is a fallback method when token refresh fails
 * @returns {Promise<boolean>} Whether the login was successful
 */
async function tryDirectLogin() {
  console.log('[SilentZone Auth] Attempting direct login as fallback...');

  try {
    // Check if we have stored credentials
    const credentials = await chrome.storage.local.get(['storedEmail', 'storedPassword']);

    if (!credentials.storedEmail || !credentials.storedPassword) {
      console.log('[SilentZone Auth] No stored credentials found for direct login');
      return false;
    }

    // Try direct login with stored credentials
    return await directLogin(credentials.storedEmail, credentials.storedPassword);
  } catch (error) {
    console.error('[SilentZone Auth] Failed to perform direct login with stored credentials:', error);
    return false;
  }
}
