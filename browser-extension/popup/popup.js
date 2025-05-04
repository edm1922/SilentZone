/**
 * SilentZone Popup Script
 * 
 * This script handles the popup UI and interactions
 */

// DOM Elements
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const toggleBtn = document.getElementById('toggleBtn');
const muteList = document.getElementById('muteList');
const emptyState = document.getElementById('emptyState');
const openAppBtn = document.getElementById('openAppBtn');
const syncBtn = document.getElementById('syncBtn');
const lastSyncTime = document.getElementById('lastSyncTime');

// State
let isActive = true;
let muteRules = [];

// Configuration
const config = {
  webAppUrl: 'http://localhost:9002',
  debugMode: true
};

// Initialize when the popup loads
document.addEventListener('DOMContentLoaded', initialize);

/**
 * Initialize the popup
 */
function initialize() {
  log('SilentZone popup initialized');
  
  // Load extension state
  loadState();
  
  // Load mute rules
  loadMuteRules();
  
  // Set up event listeners
  setupEventListeners();
}

/**
 * Load extension state from storage
 */
function loadState() {
  chrome.storage.local.get(['isActive', 'lastSyncTime'], (result) => {
    // Set active state
    if (result.isActive !== undefined) {
      isActive = result.isActive;
      updateStatusUI();
    }
    
    // Set last sync time
    if (result.lastSyncTime) {
      updateLastSyncTime(result.lastSyncTime);
    }
  });
}

/**
 * Load mute rules from background script
 */
function loadMuteRules() {
  chrome.runtime.sendMessage({ action: 'getMuteRules' }, (response) => {
    if (response && response.muteRules) {
      muteRules = response.muteRules;
      renderMuteList();
    }
  });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Toggle active state
  toggleBtn.addEventListener('click', () => {
    isActive = !isActive;
    updateStatusUI();
    saveState();
  });
  
  // Open web app
  openAppBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: config.webAppUrl });
  });
  
  // Sync now
  syncBtn.addEventListener('click', () => {
    syncNow();
  });
}

/**
 * Update the status UI based on active state
 */
function updateStatusUI() {
  if (isActive) {
    statusDot.classList.remove('paused');
    statusDot.classList.add('active');
    statusText.textContent = 'Active';
    toggleBtn.textContent = 'Pause';
  } else {
    statusDot.classList.remove('active');
    statusDot.classList.add('paused');
    statusText.textContent = 'Paused';
    toggleBtn.textContent = 'Resume';
  }
}

/**
 * Save extension state to storage
 */
function saveState() {
  chrome.storage.local.set({ isActive }, () => {
    log('Saved extension state');
  });
}

/**
 * Render the list of mute rules
 */
function renderMuteList() {
  // Clear existing items (except empty state)
  Array.from(muteList.children).forEach(child => {
    if (child !== emptyState) {
      child.remove();
    }
  });
  
  // Show/hide empty state
  if (muteRules.length === 0) {
    emptyState.style.display = 'block';
    return;
  } else {
    emptyState.style.display = 'none';
  }
  
  // Add mute items
  muteRules.forEach(rule => {
    const muteItem = createMuteItem(rule);
    muteList.appendChild(muteItem);
  });
}

/**
 * Create a mute item element
 */
function createMuteItem(rule) {
  const item = document.createElement('div');
  item.className = 'mute-item';
  
  // Calculate time remaining
  const now = Date.now();
  const expiryTime = rule.startTime + rule.durationMs;
  const isExpired = now > expiryTime;
  const timeRemaining = isExpired ? 'Expired' : formatTimeRemaining(expiryTime - now);
  
  // Create platform badges HTML
  const platformsHtml = rule.platforms.map(platform => {
    return `<span class="platform-badge">${platform.name}</span>`;
  }).join('');
  
  // Set item HTML
  item.innerHTML = `
    <div class="mute-item-header">
      <div class="mute-keywords">${rule.keywords.join(', ')}</div>
      <button class="mute-remove" data-rule-id="${rule.id}">Remove</button>
    </div>
    <div class="mute-details">
      <div>Time remaining: ${timeRemaining}</div>
      <div class="mute-platforms">
        ${platformsHtml}
      </div>
    </div>
  `;
  
  // Add remove button event listener
  item.querySelector('.mute-remove').addEventListener('click', () => {
    removeMuteRule(rule.id);
  });
  
  return item;
}

/**
 * Format time remaining in a human-readable format
 */
function formatTimeRemaining(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return 'Less than a minute';
  }
}

/**
 * Remove a mute rule
 */
function removeMuteRule(ruleId) {
  chrome.runtime.sendMessage({ 
    action: 'removeMuteRule', 
    ruleId 
  }, (response) => {
    if (response && response.success) {
      // Update local list
      muteRules = muteRules.filter(rule => rule.id !== ruleId);
      renderMuteList();
    }
  });
}

/**
 * Sync with web app
 */
function syncNow() {
  syncBtn.disabled = true;
  syncBtn.textContent = 'Syncing...';
  
  chrome.runtime.sendMessage({ action: 'syncNow' }, (response) => {
    if (response && response.success) {
      // Update last sync time
      const now = Date.now();
      updateLastSyncTime(now);
      chrome.storage.local.set({ lastSyncTime: now });
      
      // Reload mute rules
      loadMuteRules();
    } else {
      // Show error
      console.error('Sync failed:', response?.error);
    }
    
    // Re-enable button
    syncBtn.disabled = false;
    syncBtn.textContent = 'Sync Now';
  });
}

/**
 * Update the last sync time display
 */
function updateLastSyncTime(timestamp) {
  if (!timestamp) {
    lastSyncTime.textContent = 'Never';
    return;
  }
  
  const date = new Date(timestamp);
  lastSyncTime.textContent = date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Utility function for logging (only in debug mode)
 */
function log(...args) {
  if (config.debugMode) {
    console.log('[SilentZone]', ...args);
  }
}
