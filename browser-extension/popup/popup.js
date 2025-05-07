/**
 * SilentZone Popup Script
 *
 * This script handles the popup UI and interactions
 */

// DOM Elements
let statusDot;
let statusText;
let toggleBtn;
let muteList;
let emptyState;
let openAppBtn;
let syncBtn;
let lastSyncTime;
let addRuleBtn;
let refreshBtn;

// State
let isActive = true;
let muteRules = [];
let isAuthenticated = false;

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

  // Get DOM elements
  statusDot = document.getElementById('statusDot');
  statusText = document.getElementById('statusText');
  toggleBtn = document.getElementById('toggleBtn');
  muteList = document.getElementById('muteList');
  emptyState = document.getElementById('emptyState');
  openAppBtn = document.getElementById('openAppBtn');
  syncBtn = document.getElementById('syncBtn');
  lastSyncTime = document.getElementById('lastSyncTime');
  addRuleBtn = document.getElementById('addRuleBtn');
  refreshBtn = document.getElementById('refreshBtn');
  const lastSyncInfo = document.getElementById('lastSyncInfo');

  // Debug DOM elements
  log('DOM Elements:');
  log('- statusDot:', statusDot ? 'Found' : 'Not found');
  log('- statusText:', statusText ? 'Found' : 'Not found');
  log('- toggleBtn:', toggleBtn ? 'Found' : 'Not found');
  log('- muteList:', muteList ? 'Found' : 'Not found');
  log('- emptyState:', emptyState ? 'Found' : 'Not found');
  log('- openAppBtn:', openAppBtn ? 'Found' : 'Not found');
  log('- syncBtn:', syncBtn ? 'Found' : 'Not found');
  log('- lastSyncTime:', lastSyncTime ? 'Found' : 'Not found');
  log('- addRuleBtn:', addRuleBtn ? 'Found' : 'Not found');
  log('- refreshBtn:', refreshBtn ? 'Found' : 'Not found');
  log('- lastSyncInfo:', lastSyncInfo ? 'Found' : 'Not found');

  // Display last sync information
  if (lastSyncInfo) {
    chrome.storage.local.get(['lastSyncTime', 'lastSyncSuccess', 'lastSyncMessage'], function(result) {
      if (result.lastSyncTime) {
        const lastSyncTime = new Date(result.lastSyncTime);
        const timeString = lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateString = lastSyncTime.toLocaleDateString();

        if (result.lastSyncSuccess === false) {
          // Show error message
          lastSyncInfo.innerHTML = `Last sync: <span style="color: #ef4444;">${timeString} - Failed${result.lastSyncMessage ? ': ' + result.lastSyncMessage : ''}</span>`;
        } else {
          // Show success message
          lastSyncInfo.innerHTML = `Last sync: <span style="color: #10b981;">${timeString}</span> - ${result.lastSyncMessage || 'Success'}`;
        }

        // Update the timestamp display
        const syncTimestamp = document.getElementById('syncTimestamp');
        if (syncTimestamp) {
          // Calculate time since last sync
          const now = Date.now();
          const timeSinceSync = now - result.lastSyncTime;
          const secondsSinceSync = Math.floor(timeSinceSync / 1000);

          syncTimestamp.innerHTML = `Last sync was ${secondsSinceSync} seconds ago. Next sync in ${Math.max(0, 10 - secondsSinceSync)} seconds.`;

          // Update the timestamp every second
          setInterval(function() {
            const now = Date.now();
            const timeSinceSync = now - result.lastSyncTime;
            const secondsSinceSync = Math.floor(timeSinceSync / 1000);

            syncTimestamp.innerHTML = `Last sync was ${secondsSinceSync} seconds ago. Next sync in ${Math.max(0, 10 - (secondsSinceSync % 10))} seconds.`;
          }, 1000);
        }
      } else {
        lastSyncInfo.innerHTML = 'No sync information available';
      }
    });
  }

  // Check authentication status
  checkAuthStatus();

  // Load extension state
  loadState();

  // Set up event listeners
  setupEventListeners();

  // Listen for auth error messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    log('Received message in popup:', message.action);

    if (message.action === 'authError') {
      log('Auth error received:', message.error);

      // Clear auth data and show login form
      chrome.storage.local.remove(['authToken', 'user'], () => {
        checkAuthStatus();

        // Show the token expired message
        const tokenExpiredMessage = document.getElementById('token-expired-message');
        if (tokenExpiredMessage) {
          tokenExpiredMessage.textContent = message.error || 'Your session has expired. Please sign in again.';
          tokenExpiredMessage.classList.remove('hidden');
        }
      });
    }
  });

  // First check if we need to do a force sync to handle web app deletions
  chrome.storage.local.get(['lastSyncStatus', 'muteRules'], (result) => {
    const lastSyncStatus = result.lastSyncStatus || {};
    const syncFailCount = lastSyncStatus.failCount || 0;
    const localRules = result.muteRules || [];

    log(`Popup initialization - Local rules: ${localRules.length}, Sync fail count: ${syncFailCount}`);

    // If we have rules locally, do a force sync to ensure we catch any web app deletions
    if (localRules.length > 0) {
      log('Found local rules, doing a force sync to check for web app deletions');

      // Use forceFullSync to ensure we catch any web app deletions
      chrome.runtime.sendMessage({ action: 'forceFullSync' }, (syncResponse) => {
        log('Force sync response:', syncResponse);

        // After sync, load rules from storage with a longer delay to ensure sync completes
        setTimeout(directLoadRulesFromStorage, 1500);
      });
    } else {
      // No local rules, just do a normal sync
      chrome.runtime.sendMessage({ action: 'syncNow' }, (syncResponse) => {
        log('Initial sync response:', syncResponse);

        // After sync, load rules from storage with a longer delay to ensure sync completes
        setTimeout(directLoadRulesFromStorage, 1000);
      });
    }
  });
}

/**
 * Direct load rules from storage - this is the most reliable method
 */
function directLoadRulesFromStorage() {
  log('DIRECT LOAD: Loading rules from storage');

  chrome.storage.local.get(['muteRules'], (result) => {
    log('DIRECT LOAD: Rules in storage:', result.muteRules ? result.muteRules.length : 0);

    if (result.muteRules && result.muteRules.length > 0) {
      log('DIRECT LOAD: Found rules, displaying them');

      // Update the global muteRules variable
      muteRules = result.muteRules;

      // Display the rules
      if (muteList && emptyState) {
        // Hide empty state
        emptyState.style.display = 'none';

        // Clear existing items
        Array.from(muteList.children).forEach(child => {
          if (child !== emptyState) {
            child.remove();
          }
        });

        // Add mute items
        result.muteRules.forEach((rule) => {
          const muteItem = createMuteItem(rule);
          muteList.appendChild(muteItem);
        });

        log('DIRECT LOAD: Successfully displayed ' + result.muteRules.length + ' rules!');
      } else {
        log('DIRECT LOAD: Could not find muteList or emptyState elements');
      }
    } else {
      log('DIRECT LOAD: No rules found in storage');

      // Try to get rules from background script
      chrome.runtime.sendMessage({ action: 'getMuteRules' }, (response) => {
        log('DIRECT LOAD: Got response from background script:', response ? 'yes' : 'no');

        if (response && response.muteRules && response.muteRules.length > 0) {
          log('DIRECT LOAD: Found rules in background script, displaying them');

          // Update the global muteRules variable
          muteRules = response.muteRules;

          // Save to storage for future use
          chrome.storage.local.set({ muteRules }, () => {
            log('DIRECT LOAD: Saved rules to storage');
          });

          // Display the rules
          if (muteList && emptyState) {
            // Hide empty state
            emptyState.style.display = 'none';

            // Clear existing items
            Array.from(muteList.children).forEach(child => {
              if (child !== emptyState) {
                child.remove();
              }
            });

            // Add mute items
            response.muteRules.forEach((rule) => {
              const muteItem = createMuteItem(rule);
              muteList.appendChild(muteItem);
            });

            log('DIRECT LOAD: Successfully displayed ' + response.muteRules.length + ' rules!');
          }
        } else {
          log('DIRECT LOAD: No rules found in background script either');

          // Try to sync with server
          syncNow();
        }
      });
    }
  });
}

/**
 * Check if the user is authenticated
 */
function checkAuthStatus() {
  chrome.storage.local.get(['authToken', 'user'], (result) => {
    if (result.authToken && result.user) {
      isAuthenticated = true;

      // Show the content section
      const authSection = document.getElementById('auth-section');
      const contentSection = document.getElementById('content-section');

      if (authSection) authSection.classList.add('hidden');
      if (contentSection) contentSection.classList.remove('hidden');

      // Update user info
      const userInfo = document.getElementById('user-info');
      if (userInfo && result.user.email) {
        userInfo.textContent = `Signed in as ${result.user.email}`;
      }

      // Load mute rules
      loadMuteRules();
    } else {
      isAuthenticated = false;

      // Show the auth section
      const authSection = document.getElementById('auth-section');
      const contentSection = document.getElementById('content-section');
      const tokenExpiredMessage = document.getElementById('token-expired-message');

      if (authSection) authSection.classList.remove('hidden');
      if (contentSection) contentSection.classList.add('hidden');

      // Hide the token expired message by default when showing the login form
      // It will be explicitly shown when a token expires
      if (tokenExpiredMessage) {
        tokenExpiredMessage.classList.add('hidden');
      }
    }
  });
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
 * Load mute rules from storage and background script
 */
function loadMuteRules() {
  log('Loading mute rules from storage and background script');

  // First, try to get rules directly from storage
  chrome.storage.local.get('muteRules', (result) => {
    log('Mute rules in storage:', result.muteRules ? JSON.stringify(result.muteRules) : 'none');
    log('Number of rules in storage:', result.muteRules ? result.muteRules.length : 0);

    // If we have rules in storage, use them immediately
    if (result.muteRules && result.muteRules.length > 0) {
      log('Found rules in storage, using those immediately');
      muteRules = result.muteRules;
      renderMuteList();
    }

    // Also try to get rules from background script as a backup
    chrome.runtime.sendMessage({ action: 'getMuteRules' }, (response) => {
      log('Got mute rules response from background:', response ? 'yes' : 'no');

      if (response && response.muteRules && response.muteRules.length > 0) {
        log('Number of mute rules from background:', response.muteRules.length);
        log('First rule details:', JSON.stringify(response.muteRules[0]));

        // Only update if we got rules from background
        muteRules = response.muteRules;
        renderMuteList();
      } else {
        log('No additional mute rules found in background script');
      }
    });
  });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  log('Setting up event listeners');

  // Toggle active state
  if (toggleBtn) {
    log('Adding click listener to toggleBtn');
    toggleBtn.addEventListener('click', () => {
      isActive = !isActive;
      updateStatusUI();
      saveState();
    });
  } else {
    log('WARNING: toggleBtn not found');
  }

  // Open web app
  if (openAppBtn) {
    log('Adding click listener to openAppBtn');
    openAppBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: config.webAppUrl });
    });
  } else {
    log('WARNING: openAppBtn not found');
  }

  // Sync now
  if (syncBtn) {
    log('Adding click listener to syncBtn');
    syncBtn.addEventListener('click', () => {
      log('syncBtn clicked');
      syncNow();
    });

    // Make sure the button is enabled
    syncBtn.disabled = false;
  } else {
    log('WARNING: syncBtn not found');
  }

  // Open signup page
  const openSignupBtn = document.getElementById('openSignupBtn');
  if (openSignupBtn) {
    openSignupBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: `${config.webAppUrl}/signup` });
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      // Clear auth data
      chrome.storage.local.remove(['authToken', 'user'], () => {
        // Show auth section
        checkAuthStatus();
      });
    });
  }

  // Manual refresh button (secondary button)
  const manualRefreshBtn = document.getElementById('manualRefreshBtn');
  if (manualRefreshBtn) {
    log('Adding click listener to manualRefreshBtn');
    manualRefreshBtn.addEventListener('click', function() {
      log('Manual refresh button clicked');

      // Use the same function as the main refresh button
      chrome.runtime.sendMessage({ action: 'forceFullSync' }, function(response) {
        log('Force sync completed, response:', response);

        // Reload the popup to show the updated data
        setTimeout(function() {
          window.location.reload();
        }, 500);
      });
    });
  }

  // Refresh button removed - using automatic 10-second sync instead
  log('Refresh button removed - using automatic 10-second sync');

  // Add Rule button
  if (addRuleBtn) {
    log('Adding click listener to addRuleBtn');
    addRuleBtn.addEventListener('click', () => {
      log('Add rule button clicked');

      // Prompt for keyword
      const keyword = prompt('Enter a keyword to mute:');
      if (!keyword || keyword.trim() === '') {
        return;
      }

      log('Creating rule for keyword:', keyword);

      // Create a simple rule with a unique ID
      const rule = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5), // Generate unique ID
        keywords: [keyword.trim()],
        platforms: [{ name: 'All Platforms', id: 'all' }],
        startTime: Date.now(),
        durationMs: 7 * 24 * 60 * 60 * 1000, // 7 days
        useRegex: false,
        caseSensitive: false,
        matchWholeWord: false
      };

      log('Sending addMuteRule message with rule:', rule);

      // Add the rule
      chrome.runtime.sendMessage({
        action: 'addMuteRule',
        rule: rule
      }, (response) => {
        log('Add rule response:', response);

        if (response && response.success) {
          // Reload mute rules to update the UI
          loadMuteRules();

          // Immediately sync with server to ensure the rule is saved
          log('Syncing with server after adding rule');
          chrome.runtime.sendMessage({
            action: 'syncNow'
          }, (syncResponse) => {
            log('Sync response after adding rule:', syncResponse);

            if (syncResponse && syncResponse.success) {
              log('Sync successful, rule should be saved to server');
            } else {
              log('Sync failed after adding rule:', syncResponse?.error);
              alert('Rule added locally but sync with server failed. Your rule may not persist after browser restart.');
            }
          });
        } else {
          alert('Failed to add rule. Please try again.');
        }
      });
    });
  } else {
    log('WARNING: addRuleBtn not found');
  }
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
 * This is a simplified version that just uses the current muteRules variable
 */
function renderMuteList() {
  log('Rendering mute list with', muteRules.length, 'rules');

  // Make sure we have the DOM elements
  if (!muteList || !emptyState) {
    log('ERROR: muteList or emptyState not found');
    return;
  }

  // Clear existing items (except empty state)
  Array.from(muteList.children).forEach(child => {
    if (child !== emptyState) {
      child.remove();
    }
  });

  // Show/hide empty state
  if (!muteRules || muteRules.length === 0) {
    log('No mute rules to display, showing empty state');
    emptyState.style.display = 'block';
    return;
  } else {
    emptyState.style.display = 'none';
  }

  // Add mute items
  muteRules.forEach((rule, index) => {
    log(`Rendering rule ${index + 1}:`, rule.keywords.join(', '));
    const muteItem = createMuteItem(rule);
    muteList.appendChild(muteItem);
  });

  log('Mute list rendering complete');
}

/**
 * Create a mute item element
 */
function createMuteItem(rule) {
  const item = document.createElement('div');
  item.className = 'mute-item';

  // Calculate time remaining
  const now = Date.now();
  const isPermanent = rule.durationMs === -1;
  const expiryTime = isPermanent ? 0 : rule.startTime + rule.durationMs;
  const isExpired = !isPermanent && now > expiryTime;
  const timeRemaining = isPermanent ? 'Permanent' : (isExpired ? 'Expired' : formatTimeRemaining(expiryTime - now));

  // Calculate progress percentage for progress bar
  let progressPercent = 0;
  let progressClass = '';

  if (isPermanent) {
    progressPercent = 0;
    progressClass = 'progress-permanent';
  } else if (isExpired) {
    progressPercent = 100;
    progressClass = 'progress-expired';
  } else {
    // Calculate percentage of time elapsed
    const totalDuration = rule.durationMs;
    const elapsed = now - rule.startTime;
    progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    if (progressPercent > 75) {
      progressClass = 'progress-critical';
    } else if (progressPercent > 50) {
      progressClass = 'progress-warning';
    } else {
      progressClass = 'progress-normal';
    }
  }

  // Create platform badges HTML
  const platformsHtml = Array.isArray(rule.platforms) ? rule.platforms.map(platform => {
    const platformName = typeof platform === 'string' ? platform : (platform.name || platform.id || 'Unknown');
    return `<span class="platform-badge">${platformName}</span>`;
  }).join('') : '';

  // Set item HTML
  item.innerHTML = `
    <div class="mute-item-header">
      <div class="mute-keywords">${rule.keywords.join(', ')}</div>
      <button class="mute-remove" data-rule-id="${rule.id}">Remove</button>
    </div>
    <div class="mute-details">
      <div class="time-remaining">
        <div class="time-label">Time remaining: <span class="time-value">${timeRemaining}</span></div>
        <div class="progress-container">
          ${isPermanent ?
            '<div class="progress-bar-permanent"><span class="infinity-symbol">∞</span></div>' :
            `<div class="progress-bar">
              <div class="progress-fill ${progressClass}" style="width: ${progressPercent}%"></div>
            </div>`
          }
        </div>
      </div>
      <div class="mute-platforms">
        ${platformsHtml}
      </div>
      <div class="sync-status">
        ${rule.serverSynced ? '<span class="synced">✓ Synced</span>' : '<span class="not-synced">⟳ Not synced</span>'}
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
  // Handle permanent mutes
  if (ms === -1) {
    return 'Permanent';
  }

  // Handle expired or invalid durations
  if (ms <= 0) {
    return 'Expired';
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // For longer durations, show days only
  if (days >= 7) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  }

  // For medium durations, show days and hours
  if (days > 0) {
    const remainingHours = hours % 24;
    if (remainingHours > 0) {
      return `${days} day${days !== 1 ? 's' : ''}, ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
    }
    return `${days} day${days !== 1 ? 's' : ''}`;
  }

  // For shorter durations, show hours and minutes
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}, ${remainingMinutes} min`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  // For very short durations
  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  return 'Less than a minute';
}

/**
 * Remove a mute rule
 */
function removeMuteRule(ruleId) {
  log('Removing rule with ID:', ruleId);

  // First, mark the rule as being deleted in the UI
  const ruleElement = document.querySelector(`.mute-remove[data-rule-id="${ruleId}"]`);
  if (ruleElement) {
    const muteItem = ruleElement.closest('.mute-item');
    if (muteItem) {
      muteItem.style.opacity = '0.5';
      muteItem.style.pointerEvents = 'none';
      ruleElement.textContent = 'Removing...';
    }
  }

  // Disable all remove buttons to prevent multiple deletions
  const allRemoveButtons = document.querySelectorAll('.mute-remove');
  allRemoveButtons.forEach(button => {
    button.disabled = true;
  });

  chrome.runtime.sendMessage({
    action: 'removeMuteRule',
    ruleId
  }, (response) => {
    log('Remove rule response:', response);

    // Re-enable all remove buttons
    allRemoveButtons.forEach(button => {
      button.disabled = false;
    });

    if (response && response.success) {
      // Update local list
      muteRules = muteRules.filter(rule => rule.id !== ruleId);
      renderMuteList();

      // Force sync with server to ensure deletion is propagated
      log('Syncing with server after rule removal');

      // Wait a moment before syncing to ensure the deletion is processed
      setTimeout(() => {
        // Use a special sync after deletion
        chrome.runtime.sendMessage({ action: 'syncAfterDeletion' }, (response) => {
          log('Sync after deletion response:', response);

          if (response && response.success) {
            log('Sync after deletion completed successfully');
          } else {
            log('Sync after deletion failed:', response?.error);
          }

          // After sync, force a reload of the rules to ensure we have the latest state
          setTimeout(() => {
            // Force a complete reload of rules from both storage and background
            chrome.storage.local.get(['muteRules'], (result) => {
              log('Rules in storage after deletion:', result.muteRules ? result.muteRules.length : 0);

              // Get rules from background script as well
              chrome.runtime.sendMessage({ action: 'getMuteRules' }, (bgResponse) => {
                log('Rules from background after deletion:',
                    bgResponse && bgResponse.muteRules ? bgResponse.muteRules.length : 0);

                // Use the rules from background script if available
                if (bgResponse && bgResponse.muteRules) {
                  muteRules = bgResponse.muteRules;
                  renderMuteList();
                }
              });
            });
          }, 1000);
        });
      }, 1000);
    } else {
      log('Failed to remove rule:', ruleId);
      alert('Failed to remove rule. Please try again.');

      // Restore the UI if the removal failed
      if (ruleElement) {
        const muteItem = ruleElement.closest('.mute-item');
        if (muteItem) {
          muteItem.style.opacity = '1';
          muteItem.style.pointerEvents = 'auto';
          ruleElement.textContent = 'Remove';
        }
      }
    }
  });
}

/**
 * Refresh rules from the server
 * This performs a complete refresh similar to reloading the extension
 */
function refreshRules() {
  console.log('REFRESH FUNCTION CALLED');
  log('Performing complete refresh of extension data');

  // Show refreshing animation
  if (refreshBtn) {
    refreshBtn.classList.add('refreshing');
    refreshBtn.disabled = true;
    refreshBtn.title = "Refreshing...";
  }

  // Show a loading message in the mute list
  if (muteList) {
    // Save the current state of the empty state
    const emptyStateDisplay = emptyState ? emptyState.style.display : 'none';

    // Clear the list and show a loading message
    Array.from(muteList.children).forEach(child => {
      if (child !== emptyState) {
        child.remove();
      }
    });

    if (emptyState) {
      emptyState.style.display = 'none';
    }

    const loadingItem = document.createElement('div');
    loadingItem.className = 'loading-message';
    loadingItem.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <div style="margin-bottom: 10px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="loading-spinner">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
        </div>
        <p>Refreshing data from server...</p>
      </div>
    `;

    // Add the loading spinner animation
    const style = document.createElement('style');
    style.textContent = `
      .loading-spinner {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    muteList.appendChild(loadingItem);
  }

  // Step 1: Force a complete sync with the server
  console.log('Step 1: Forcing complete sync with server');
  chrome.runtime.sendMessage({ action: 'forceFullSync' }, (syncResponse) => {
    console.log('Force sync response received:', syncResponse);
    log('Force sync completed with status:', syncResponse?.success ? 'success' : 'failed');

    // Step 2: Clear and reload all data from storage
    console.log('Step 2: Reloading all data from storage');
    chrome.storage.local.get(['muteRules', 'isActive', 'lastSyncTime', 'user'], (storageData) => {
      console.log('Storage data loaded:', storageData);
      log('Loaded data from storage');

      // Step 3: Get fresh data from background script
      console.log('Step 3: Getting fresh data from background script');
      chrome.runtime.sendMessage({ action: 'getMuteRules' }, (bgResponse) => {
        console.log('Background script data received:', bgResponse);
        log('Received fresh data from background script');

        // Step 4: Update all UI elements with fresh data
        console.log('Step 4: Updating UI with fresh data');

        // Update mute rules
        if (bgResponse && bgResponse.muteRules) {
          muteRules = bgResponse.muteRules;
        } else if (storageData.muteRules) {
          muteRules = storageData.muteRules;
        }

        // Update active state
        if (storageData.isActive !== undefined) {
          isActive = storageData.isActive;
          updateStatusUI();
        }

        // Update last sync time
        if (storageData.lastSyncTime) {
          updateLastSyncTime(storageData.lastSyncTime);
        } else {
          updateLastSyncTime(Date.now());
        }

        // Step 5: Re-render the UI
        console.log('Step 5: Re-rendering UI');
        renderMuteList();

        // Step 6: Finalize refresh
        console.log('Step 6: Finalizing refresh');

        // Show success message
        log('Complete refresh finished successfully');

        // The most reliable way to ensure everything is refreshed is to reload the popup
        console.log('Reloading popup for a complete refresh');
        window.location.reload();

        // This code will only run if the reload fails for some reason
        setTimeout(() => {
          // Remove refreshing animation
          if (refreshBtn) {
            refreshBtn.classList.remove('refreshing');
            refreshBtn.disabled = false;
            refreshBtn.title = "Refresh mute rules";
          }

          // Force a final check for any missed updates
          chrome.runtime.sendMessage({ action: 'getMuteRules' }, (finalResponse) => {
            if (finalResponse && finalResponse.muteRules &&
                JSON.stringify(finalResponse.muteRules) !== JSON.stringify(muteRules)) {
              log('Found additional updates, refreshing UI again');
              muteRules = finalResponse.muteRules;
              renderMuteList();
            }
          });
        }, 1000);
      });
    });
  });
}

/**
 * Sync with web app
 */
function syncNow() {
  log('syncNow function called');

  // Check if syncBtn exists
  if (!syncBtn) {
    log('ERROR: syncBtn is null or undefined');
    alert('Error: Sync button not found. Please reload the extension.');
    return;
  }

  // Check if authenticated
  if (!isAuthenticated) {
    log('Not authenticated, showing alert');
    alert('Please sign in to sync your mute rules');
    return;
  }

  log('Setting syncBtn to disabled state');
  syncBtn.disabled = true;
  syncBtn.textContent = 'Syncing...';

  // Add a visual indicator
  syncBtn.style.opacity = '0.7';

  log('Manually triggering sync...');

  // First, check if we need to do a force sync
  // This happens when there's a mismatch between extension and web app
  chrome.storage.local.get(['lastSyncStatus'], (result) => {
    const lastSyncStatus = result.lastSyncStatus || {};
    const syncFailCount = lastSyncStatus.failCount || 0;

    // If we've had multiple sync failures, try a force sync
    const shouldForceSync = syncFailCount >= 2;

    log(`Sync fail count: ${syncFailCount}, Should force sync: ${shouldForceSync}`);

    // Choose which sync action to use
    const syncAction = shouldForceSync ? 'forceFullSync' : 'syncNow';

    if (shouldForceSync) {
      log('USING FORCE SYNC due to previous sync failures');
    }

    chrome.runtime.sendMessage({ action: syncAction }, (response) => {
      log(`${syncAction} response:`, response);

      if (response && response.success) {
        // Update last sync time
        const now = Date.now();
        updateLastSyncTime(now);
        chrome.storage.local.set({
          lastSyncTime: now,
          lastSyncStatus: { failCount: 0, lastSuccess: now }
        });

        // Reload mute rules
        loadMuteRules();

        log('Sync completed successfully');
      } else {
        // Update sync fail count
        chrome.storage.local.set({
          lastSyncStatus: {
            failCount: syncFailCount + 1,
            lastFail: Date.now()
          }
        });
      // Check if authentication error
      if (response?.error && (response.error.includes('Unauthorized') || response.error.includes('invalid token'))) {
        // Clear auth data and show login form
        chrome.storage.local.remove(['authToken', 'user'], () => {
          checkAuthStatus();

          // Show the token expired message
          const tokenExpiredMessage = document.getElementById('token-expired-message');
          if (tokenExpiredMessage) {
            tokenExpiredMessage.textContent = 'Your session has expired. Please sign in again.';
            tokenExpiredMessage.classList.remove('hidden');
          }
        });

        log('Authentication error during sync');
      } else {
        // Show error
        console.error('Sync failed:', response?.error);
        log('Sync failed:', response?.error);
        alert('Sync failed. Please try again later.');
      }
    }

    // Re-enable button
    log('Re-enabling syncBtn');
    syncBtn.disabled = false;
    syncBtn.textContent = 'Sync Now';
    syncBtn.style.opacity = '1';

    // Force a redraw of the button
    syncBtn.style.display = 'none';
    setTimeout(() => {
      syncBtn.style.display = 'block';
    }, 10);
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
