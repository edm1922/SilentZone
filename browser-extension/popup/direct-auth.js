/**
 * SilentZone Extension Direct Authentication
 *
 * This script provides a simplified authentication flow for the extension popup.
 */

// Import the direct authentication functions
import { directAuthenticate, getAuthToken } from '../scripts/direct-auth-helper.js';

// DOM Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const authSection = document.getElementById('auth-section');
const contentSection = document.getElementById('content-section');
const authStatus = document.getElementById('auth-status');
const tokenExpiredMessage = document.getElementById('token-expired-message');

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

// Initialize authentication
initAuth();

/**
 * Initialize authentication
 */
async function initAuth() {
  console.log('[SilentZone Auth] Initializing authentication...');
  
  // Show the auth status while we check
  showAuthStatus();
  
  // Try to get a valid token
  const token = await getAuthToken();
  
  if (token) {
    // We have a valid token, show the content section
    console.log('[SilentZone Auth] Valid token found, showing content');
    
    // Get the user data
    const userData = await new Promise(resolve => {
      chrome.storage.local.get(['user'], resolve);
    });
    
    if (userData.user) {
      showLoggedInState(userData.user);
      
      // Trigger sync with web app
      console.log('[SilentZone Auth] Triggering sync with web app after authentication');
      chrome.runtime.sendMessage({ action: 'syncNow' });
      
      // Force a full sync to ensure all data is up to date
      console.log('[SilentZone Auth] Forcing full sync with web app');
      chrome.runtime.sendMessage({ action: 'forceFullSync' });
    } else {
      console.error('[SilentZone Auth] Valid token but no user data found');
      showLoginForm();
    }
  } else {
    // No valid token, show the login form
    console.log('[SilentZone Auth] No valid token found, showing login form');
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
    
    // Try direct authentication
    const success = await directAuthenticate(email, password);
    
    if (success) {
      console.log('[SilentZone Auth] Login successful');
      
      // Get the user data
      const userData = await new Promise(resolve => {
        chrome.storage.local.get(['user'], resolve);
      });
      
      // Show logged in state
      showLoggedInState(userData.user);
      
      // Trigger sync with web app
      console.log('[SilentZone Auth] Triggering sync with web app after login');
      chrome.runtime.sendMessage({ action: 'syncNow' });
      
      // Force a full sync to ensure all data is up to date
      console.log('[SilentZone Auth] Forcing full sync with web app');
      chrome.runtime.sendMessage({ action: 'forceFullSync' });
    } else {
      console.error('[SilentZone Auth] Login failed');
      showLoginError('Login failed. Please check your email and password.');
      
      // Reset form state
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign in';
    }
  } catch (error) {
    console.error('[SilentZone Auth] Login error:', error);
    showLoginError(error.message || 'Login failed. Please try again.');
    
    // Reset form state
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign in';
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  // Clear auth data
  await new Promise(resolve => {
    chrome.storage.local.remove(['authToken', 'refreshToken', 'tokenExpiry', 'user', 'storedEmail', 'storedPassword'], resolve);
  });
  
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
  if (authStatus) authStatus.classList.add('hidden');
  
  // Update UI with user info
  const userInfo = document.getElementById('user-info');
  if (userInfo && user) {
    userInfo.textContent = `Signed in as ${user.email}`;
  }
}

/**
 * Show login form
 */
function showLoginForm() {
  if (authSection) authSection.classList.remove('hidden');
  if (contentSection) contentSection.classList.add('hidden');
  if (loginForm) loginForm.classList.remove('hidden');
  if (authStatus) authStatus.classList.add('hidden');
  
  // Hide the token expired message by default
  if (tokenExpiredMessage) {
    tokenExpiredMessage.classList.add('hidden');
  }
}

/**
 * Show authentication status
 */
function showAuthStatus() {
  if (authSection) authSection.classList.remove('hidden');
  if (contentSection) contentSection.classList.add('hidden');
  if (loginForm) loginForm.classList.add('hidden');
  if (authStatus) authStatus.classList.remove('hidden');
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
  if (tokenExpiredMessage) {
    tokenExpiredMessage.textContent = message || 'Your session has expired. Please sign in again.';
    tokenExpiredMessage.classList.remove('hidden');
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message) => {
  console.log('[SilentZone Auth] Received message:', message);
  
  if (message.action === 'authError') {
    console.log('[SilentZone Auth] Auth error:', message.error);
    
    // Clear auth data and show login form
    chrome.storage.local.remove(['authToken', 'refreshToken', 'tokenExpiry', 'user'], () => {
      showLoginForm();
      
      // Show the token expired message
      showTokenExpiredMessage(message.error || 'Your session has expired. Please sign in again.');
    });
  }
});
