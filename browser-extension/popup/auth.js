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
  webAppUrl: 'http://localhost:9002', // URL of the SilentZone web app
};

// Initialize authentication
initAuth();

/**
 * Initialize authentication
 */
async function initAuth() {
  // Check if we have an auth token
  const authData = await chrome.storage.local.get(['authToken', 'user']);

  if (authData.authToken && authData.user) {
    // We have an auth token, show the content section
    showLoggedInState(authData.user);
  } else {
    // No auth token, show the login form
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

  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
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
    // Make API call to login
    const response = await fetch(`${config.webAppUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server responded with ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.token && data.user) {
      // Store auth token and user data
      await chrome.storage.local.set({
        authToken: data.token,
        user: data.user,
      });

      // Show logged in state
      showLoggedInState(data.user);

      // Trigger sync with web app
      chrome.runtime.sendMessage({ action: 'syncNow' });
    } else {
      // If login succeeded but we didn't get a token, try to get an extension token
      await getExtensionToken();
    }
  } catch (error) {
    console.error('Login failed:', error);
    showLoginError(error.message || 'Login failed. Please try again.');
  } finally {
    // Reset form state
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign in';
  }
}

/**
 * Get an extension token after successful login
 */
async function getExtensionToken() {
  try {
    // Make API call to get extension token
    const response = await fetch(`${config.webAppUrl}/api/auth/extension-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server responded with ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.token && data.user) {
      // Store auth token and user data
      await chrome.storage.local.set({
        authToken: data.token,
        user: data.user,
      });

      // Show logged in state
      showLoggedInState(data.user);

      // Trigger sync with web app
      chrome.runtime.sendMessage({ action: 'syncNow' });
    } else {
      throw new Error(data.error || 'Failed to get extension token');
    }
  } catch (error) {
    console.error('Failed to get extension token:', error);
    showLoginError(error.message || 'Authentication failed. Please try again.');
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
