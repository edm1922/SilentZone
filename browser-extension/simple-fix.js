/**
 * SilentZone Simple Fix Script
 *
 * This script provides simple fixes and utilities for the SilentZone extension
 */

// Configuration - using a different name to avoid conflicts
const simplefixConfig = {
  webAppUrl: 'http://localhost:9002', // URL of the SilentZone web app
  debugMode: true // Enable console logs for debugging
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('[SilentZone] Simple fix script loaded');

  // Fix for missing sync button
  const syncBtn = document.getElementById('syncBtn');
  if (!syncBtn) {
    console.log('[SilentZone] Creating missing sync button');
    createSyncButton();
  }

  // Fix for missing refresh functionality
  fixRefreshFunctionality();

  // Force a sync with the server first
  chrome.runtime.sendMessage({ action: 'forceFullSync' }, function(response) {
    console.log('[SilentZone] Force sync completed, response:', response);

    // Then fix the rules display
    setTimeout(function() {
      console.log('[SilentZone] Fixing rules display...');
      fixRulesDisplay();
    }, 1000);
  });
});

/**
 * Create a sync button if it's missing
 */
function createSyncButton() {
  const actionsDiv = document.querySelector('.actions');
  if (!actionsDiv) return;

  const syncBtn = document.createElement('button');
  syncBtn.id = 'syncBtn';
  syncBtn.className = 'secondary-btn';
  syncBtn.textContent = 'Sync Now';
  syncBtn.addEventListener('click', function() {
    console.log('[SilentZone] Sync button clicked');
    // Send message to background script to sync
    chrome.runtime.sendMessage({ action: 'syncNow' }, function(response) {
      console.log('[SilentZone] Sync response:', response);
    });
  });

  actionsDiv.appendChild(syncBtn);
}

/**
 * Fix refresh functionality
 */
function fixRefreshFunctionality() {
  // Add a manual refresh button if needed
  const manualRefreshBtn = document.getElementById('manualRefreshBtn');
  if (!manualRefreshBtn) {
    console.log('[SilentZone] Adding manual refresh functionality');

    const actionsDiv = document.querySelector('.actions');
    if (actionsDiv) {
      const refreshBtn = document.createElement('button');
      refreshBtn.id = 'manualRefreshBtn';
      refreshBtn.className = 'secondary-btn';
      refreshBtn.textContent = 'Force Refresh';
      refreshBtn.style.display = 'none'; // Hidden by default

      refreshBtn.addEventListener('click', function() {
        console.log('[SilentZone] Manual refresh button clicked');

        chrome.runtime.sendMessage({ action: 'forceFullSync' }, function(response) {
          console.log('[SilentZone] Force sync completed, response:', response);

          // Reload the popup to show the updated data
          setTimeout(function() {
            window.location.reload();
          }, 500);
        });
      });

      actionsDiv.appendChild(refreshBtn);
    }
  }
}

/**
 * Fix rules display
 */
function fixRulesDisplay() {
  console.log('[SilentZone] Fixing rules display...');

  // Get rules directly from storage
  chrome.storage.local.get(['muteRules'], (result) => {
    console.log('[SilentZone] Rules in storage:', result.muteRules ? result.muteRules.length : 0);

    if (result.muteRules && result.muteRules.length > 0) {
      console.log('[SilentZone] Found rules in storage:', JSON.stringify(result.muteRules, null, 2));

      // Force display of rules
      const muteList = document.getElementById('muteList');
      const emptyState = document.getElementById('emptyState');

      if (muteList && emptyState) {
        console.log('[SilentZone] Found muteList and emptyState elements');

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
          console.log('[SilentZone] Adding rule to display:', rule.keywords.join(', '));

          const item = document.createElement('div');
          item.className = 'mute-item';

          // Calculate time remaining
          const now = Date.now();
          const isPermanent = rule.durationMs === -1;
          const expiryTime = isPermanent ? 0 : rule.startTime + rule.durationMs;
          const isExpired = !isPermanent && now > expiryTime;
          const timeRemaining = isPermanent ? 'Permanent' : (isExpired ? 'Expired' : formatTimeRemaining(expiryTime - now));

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
          const removeBtn = item.querySelector('.mute-remove');
          if (removeBtn) {
            removeBtn.addEventListener('click', function() {
              console.log('[SilentZone] Remove button clicked for rule:', rule.id);
              // Send message to background script to remove rule
              chrome.runtime.sendMessage({
                action: 'removeMuteRule',
                ruleId: rule.id
              }, function(response) {
                console.log('[SilentZone] Remove rule response:', response);
                if (response && response.success) {
                  // Reload the popup to show the updated rules
                  setTimeout(function() {
                    window.location.reload();
                  }, 1000);
                } else {
                  alert('Failed to remove rule. Please try again.');
                }
              });
            });
          }

          muteList.appendChild(item);
        });

        console.log('[SilentZone] Successfully displayed ' + result.muteRules.length + ' rules!');
      } else {
        console.error('[SilentZone] Could not find muteList or emptyState elements');
        console.log('[SilentZone] muteList:', muteList);
        console.log('[SilentZone] emptyState:', emptyState);

        // Try to find the elements by different means
        const allDivs = document.querySelectorAll('div');
        console.log('[SilentZone] Total divs on page:', allDivs.length);

        // Look for elements with similar IDs or classes
        const possibleLists = document.querySelectorAll('.mute-list, #mute-list, [id*="mute"]');
        console.log('[SilentZone] Possible mute lists found:', possibleLists.length);

        // Force reload the popup as a last resort
        console.log('[SilentZone] Forcing popup reload to fix display issues');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } else {
      console.log('[SilentZone] No rules found in storage');

      // If no rules in storage, try to get them from background script
      chrome.runtime.sendMessage({ action: 'getMuteRules' }, (response) => {
        console.log('[SilentZone] Got response from background script:', response ? 'yes' : 'no');

        if (response && response.muteRules && response.muteRules.length > 0) {
          console.log('[SilentZone] Found rules in background script, displaying them');

          // Save to storage for future use
          chrome.storage.local.set({ muteRules: response.muteRules }, () => {
            console.log('[SilentZone] Saved rules to storage');

            // Call this function again to display the rules
            fixRulesDisplay();
          });
        } else {
          console.log('[SilentZone] No rules found in background script either');

          // Try to sync with server
          chrome.runtime.sendMessage({ action: 'syncNow' }, (syncResponse) => {
            console.log('[SilentZone] Sync response:', syncResponse);

            if (syncResponse && syncResponse.success) {
              console.log('[SilentZone] Sync successful, reloading rules');

              // Wait a moment for the sync to complete
              setTimeout(fixRulesDisplay, 1000);
            } else {
              // Force reload the popup as a last resort
              console.log('[SilentZone] Forcing popup reload to fix display issues');
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            }
          });
        }
      });
    }
  });
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
  console.log('[SilentZone] Removing rule with ID:', ruleId);

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

  chrome.runtime.sendMessage({
    action: 'removeMuteRule',
    ruleId
  }, (response) => {
    console.log('[SilentZone] Remove rule response:', response);

    if (response && response.success) {
      // Reload the popup to show the updated rules
      setTimeout(function() {
        window.location.reload();
      }, 1000);
    } else {
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
 * Utility function for logging (only in debug mode)
 */
function log(...args) {
  if (simplefixConfig.debugMode) {
    console.log('[SilentZone]', ...args);
  }
}
