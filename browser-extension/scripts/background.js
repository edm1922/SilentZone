/**
 * SilentZone Background Script
 *
 * This script runs in the background and is responsible for:
 * 1. Managing mute rules
 * 2. Communicating with content scripts
 * 3. Syncing with the SilentZone web app
 */

// Store for mute rules
let muteRules = [];

// Configuration
const config = {
  syncInterval: 5 * 60 * 1000, // How often to sync with web app (5 minutes)
  webAppUrl: 'http://localhost:9002', // URL of the SilentZone web app
  debugMode: true // Enable console logs for debugging
};

// Initialize when the extension loads
initialize();

/**
 * Initialize the background script
 */
function initialize() {
  log('SilentZone background script initialized');

  // Load mute rules from storage
  loadMuteRules();

  // Set up periodic sync with web app
  setInterval(syncWithWebApp, config.syncInterval);

  // Listen for messages from content scripts and popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender, sendResponse);
    return true; // Keep the message channel open for async responses
  });
}

/**
 * Handle incoming messages
 */
function handleMessage(message, sender, sendResponse) {
  log('Received message:', message);

  switch (message.action) {
    case 'getMuteRules':
      // Send mute rules to the requesting script
      sendResponse({ muteRules });
      break;

    case 'addMuteRule':
      // Add a new mute rule
      addMuteRule(message.rule);
      sendResponse({ success: true });
      break;

    case 'removeMuteRule':
      // Remove a mute rule
      removeMuteRule(message.ruleId);
      sendResponse({ success: true });
      break;

    case 'syncNow':
      // Manually trigger sync with web app
      syncWithWebApp()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error }));
      break;

    default:
      log('Unknown action:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
}

/**
 * Load mute rules from storage
 */
function loadMuteRules() {
  chrome.storage.local.get('muteRules', (result) => {
    if (result.muteRules) {
      muteRules = result.muteRules;
      log('Loaded mute rules from storage:', muteRules);

      // Clean up expired rules
      cleanupExpiredRules();
    } else {
      log('No mute rules found in storage');
    }
  });
}

/**
 * Save mute rules to storage
 */
function saveMuteRules() {
  chrome.storage.local.set({ muteRules }, () => {
    log('Saved mute rules to storage');
  });
}

/**
 * Add a new mute rule
 */
function addMuteRule(rule) {
  // Generate ID if not provided
  if (!rule.id) {
    rule.id = generateUniqueId();
  }

  // Add timestamp if not provided
  if (!rule.startTime) {
    rule.startTime = Date.now();
  }

  // Add the rule
  muteRules.push(rule);

  // Save to storage
  saveMuteRules();

  // Notify content scripts
  notifyContentScripts();

  log('Added mute rule:', rule);
}

/**
 * Remove a mute rule
 */
function removeMuteRule(ruleId) {
  // Find and remove the rule
  const initialLength = muteRules.length;
  muteRules = muteRules.filter(rule => rule.id !== ruleId);

  // If a rule was removed, save and notify
  if (muteRules.length < initialLength) {
    saveMuteRules();
    notifyContentScripts();
    log('Removed mute rule:', ruleId);
  }
}

/**
 * Clean up expired rules
 */
function cleanupExpiredRules() {
  const now = Date.now();
  const initialLength = muteRules.length;

  // Filter out expired rules
  muteRules = muteRules.filter(rule => {
    const expiryTime = rule.startTime + rule.durationMs;
    return now <= expiryTime;
  });

  // If rules were removed, save and notify
  if (muteRules.length < initialLength) {
    saveMuteRules();
    notifyContentScripts();
    log('Cleaned up expired rules');
  }
}

/**
 * Notify all content scripts about updated rules
 */
function notifyContentScripts() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateMuteRules',
        muteRules
      }).catch(error => {
        // Ignore errors from tabs that don't have the content script running
        log('Error sending message to tab', tab.id, error);
      });
    });
  });
}

/**
 * Sync mute rules with the SilentZone web app
 */
async function syncWithWebApp() {
  log('Syncing with web app...');

  try {
    // Make API call to sync with web app
    const response = await fetch(`${config.webAppUrl}/api/mute-rules/sync`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientRules: muteRules,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.serverRules) {
      // Update local rules with server rules
      muteRules = data.serverRules;

      // Save to storage
      saveMuteRules();

      // Notify content scripts
      notifyContentScripts();

      // Update last sync time
      const now = Date.now();
      chrome.storage.local.set({ lastSyncTime: now });

      log('Sync completed successfully');
      return true;
    } else {
      throw new Error('Invalid server response');
    }
  } catch (error) {
    log('Sync failed:', error);
    return false;
  }
}

/**
 * Generate a unique ID for a rule
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Utility function for logging (only in debug mode)
 */
function log(...args) {
  if (config.debugMode) {
    console.log('[SilentZone]', ...args);
  }
}
