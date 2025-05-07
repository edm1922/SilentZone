/**
 * SilentZone Popup Inline Scripts
 * 
 * This file contains scripts that were previously inline in popup.html
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('[SilentZone Inline] DOM fully loaded');

  // Add event listener for the quick add link
  const quickAddLink = document.getElementById('quickAddLink');
  if (quickAddLink) {
    console.log('[SilentZone Inline] Found quickAddLink, adding click listener');
    quickAddLink.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('[SilentZone Inline] Quick add link clicked');
      addQuickRule();
    });
  } else {
    console.log('[SilentZone Inline] quickAddLink not found');
  }

  // Add event listeners for buttons
  const openAppBtn = document.getElementById('openAppBtn');
  if (openAppBtn) {
    openAppBtn.addEventListener('click', openApp);
  }

  // Add event listener for create rule button
  const createRuleBtn = document.getElementById('createRuleBtn');
  if (createRuleBtn) {
    createRuleBtn.addEventListener('click', openCreateRule);
  }
});

/**
 * Open the SilentZone web app
 */
function openApp() {
  chrome.tabs.create({ url: 'http://localhost:9002' });
}

/**
 * Open the create rule page in the SilentZone web app
 */
function openCreateRule() {
  chrome.tabs.create({ url: 'http://localhost:9002/create-rule' });
}

/**
 * Add a rule (called from button click)
 */
function addRule() {
  console.log('[SilentZone Inline] Add rule button clicked via handler');
  addQuickRule();
}

/**
 * Add a quick rule
 */
function addQuickRule() {
  // Prompt for keyword
  const keyword = prompt('Enter a keyword to mute:');
  if (!keyword || keyword.trim() === '') {
    return;
  }

  console.log('[SilentZone Inline] Creating rule for keyword:', keyword);

  // Create a simple rule
  const rule = {
    keywords: [keyword.trim()],
    platforms: [{ name: 'All Platforms', id: 'all' }],
    startTime: Date.now(),
    durationMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    useRegex: false,
    caseSensitive: false,
    matchWholeWord: false
  };

  console.log('[SilentZone Inline] Sending addMuteRule message with rule:', rule);

  // Add the rule
  chrome.runtime.sendMessage({
    action: 'addMuteRule',
    rule: rule
  }, (response) => {
    console.log('[SilentZone Inline] Add rule response:', response);

    if (response && response.success) {
      // Reload the popup to show the new rule
      window.location.reload();
    } else {
      alert('Failed to add rule. Please try again.');
    }
  });
}

/**
 * Sync now (called from button click)
 */
function syncNow() {
  console.log('[SilentZone Inline] Sync button clicked via handler');
  // Get the sync button
  const syncBtn = document.getElementById('syncBtn');
  if (syncBtn) {
    // Disable the button to show it's working
    syncBtn.disabled = true;
    syncBtn.textContent = 'Syncing...';

    // Send message to background script
    chrome.runtime.sendMessage({ action: 'syncNow' }, (response) => {
      console.log('[SilentZone Inline] Sync response:', response);

      // Re-enable the button
      syncBtn.disabled = false;
      syncBtn.textContent = 'Sync Now';

      if (response && response.success) {
        // Update last sync time
        const now = Date.now();
        const lastSyncTime = document.getElementById('lastSyncTime');
        if (lastSyncTime) {
          const date = new Date(now);
          lastSyncTime.textContent = date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });
        }

        // Reload the popup to show updated rules
        window.location.reload();
      } else {
        alert('Sync failed. Please try again later.');
      }
    });
  }
}
