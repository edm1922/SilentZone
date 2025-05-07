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
  syncInterval: 10 * 1000, // How often to sync with web app (10 seconds)
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

  // Check for sync issues on startup
  chrome.storage.local.get(['lastSyncStatus', 'muteRules'], (result) => {
    const lastSyncStatus = result.lastSyncStatus || {};
    const syncFailCount = lastSyncStatus.failCount || 0;
    const localRules = result.muteRules || [];

    log(`Startup check - Local rules: ${localRules.length}, Sync fail count: ${syncFailCount}`);

    // If we have rules locally but previous syncs failed, try a force sync
    if (localRules.length > 0 && syncFailCount > 0) {
      log('Detected potential sync issues on startup, will attempt force sync');

      // Wait a bit to ensure everything is loaded
      setTimeout(() => {
        forceFullSync().then(success => {
          log('Startup force sync completed with status:', success ? 'success' : 'failed');

          if (success) {
            // Reset fail count on success
            chrome.storage.local.set({
              lastSyncStatus: { failCount: 0, lastSuccess: Date.now() }
            });
          }
        });
      }, 5000); // Wait 5 seconds before force sync
    } else {
      // Normal sync on startup
      log('Performing immediate initial sync...');
      syncWithWebApp().then(success => {
        log('Initial sync completed with status:', success ? 'success' : 'failed');

        // Update sync status
        if (success) {
          chrome.storage.local.set({
            lastSyncStatus: { failCount: 0, lastSuccess: Date.now() }
          });
        } else {
          // Increment fail count
          chrome.storage.local.set({
            lastSyncStatus: {
              failCount: syncFailCount + 1,
              lastFail: Date.now()
            }
          });

          // If first sync fails, try again after 3 seconds
          setTimeout(() => {
            log('Retrying sync...');
            syncWithWebApp().then(retrySuccess => {
              log('Retry sync completed with status:', retrySuccess ? 'success' : 'failed');

              // Update sync status
              if (retrySuccess) {
                chrome.storage.local.set({
                  lastSyncStatus: { failCount: 0, lastSuccess: Date.now() }
                });
              } else {
                chrome.storage.local.set({
                  lastSyncStatus: {
                    failCount: syncFailCount + 2,
                    lastFail: Date.now()
                  }
                });
              }
            });
          }, 3000);
        }
      });
    }
  });

  // Set up periodic sync with web app
  setInterval(() => {
    const currentTime = new Date().toLocaleTimeString();
    console.log(`[${currentTime}] PERIODIC SYNC: Starting 10-second sync cycle`);
    log(`Periodic sync starting at ${currentTime}`);

    syncWithWebApp().then(success => {
      const completionTime = new Date().toLocaleTimeString();
      console.log(`[${completionTime}] PERIODIC SYNC: Completed with status: ${success ? 'SUCCESS' : 'FAILED'}`);
      log(`Periodic sync completed at ${completionTime} with status: ${success ? 'success' : 'failed'}`);

      // Update sync status
      chrome.storage.local.get(['lastSyncStatus'], (result) => {
        const lastSyncStatus = result.lastSyncStatus || {};
        const syncFailCount = lastSyncStatus.failCount || 0;

        if (success) {
          // Reset fail count on success
          chrome.storage.local.set({
            lastSyncTime: Date.now(),
            lastSyncStatus: { failCount: 0, lastSuccess: Date.now() }
          });
          console.log(`[${completionTime}] PERIODIC SYNC: Updated lastSyncTime to ${completionTime}`);
        } else if (syncFailCount > 2) {
          // If we've failed multiple times, try a force sync
          log('Multiple sync failures detected, attempting force sync');
          console.log(`[${completionTime}] PERIODIC SYNC: Multiple failures detected, attempting force sync`);

          forceFullSync().then(forceSuccess => {
            const forceCompletionTime = new Date().toLocaleTimeString();
            log(`Force sync completed at ${forceCompletionTime} with status: ${forceSuccess ? 'success' : 'failed'}`);
            console.log(`[${forceCompletionTime}] FORCE SYNC: Completed with status: ${forceSuccess ? 'SUCCESS' : 'FAILED'}`);

            if (forceSuccess) {
              // Reset fail count on success
              chrome.storage.local.set({
                lastSyncTime: Date.now(),
                lastSyncStatus: { failCount: 0, lastSuccess: Date.now() }
              });
            }
          });
        } else {
          // Increment fail count
          chrome.storage.local.set({
            lastSyncStatus: {
              failCount: syncFailCount + 1,
              lastFail: Date.now()
            }
          });
        }
      });
    });
  }, config.syncInterval);

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
      // Remove a mute rule - this is now async
      removeMuteRule(message.ruleId)
        .then(success => {
          sendResponse({ success });
        })
        .catch(error => {
          log('Error in removeMuteRule:', error);
          sendResponse({ success: false, error: String(error) });
        });
      return true; // Keep the message channel open for async response
      break;

    case 'syncNow':
      // Manually trigger sync with web app
      syncWithWebApp()
        .then(success => sendResponse({ success }))
        .catch(error => sendResponse({ success: false, error: String(error) }));
      return true; // Keep the message channel open for async response
      break;

    case 'syncAfterDeletion':
      // Manually trigger sync after deletion
      syncAfterDeletion()
        .then(success => sendResponse({ success }))
        .catch(error => sendResponse({ success: false, error: String(error) }));
      return true; // Keep the message channel open for async response
      break;

    case 'forceFullSync':
      // Force a full sync of all rules to the web app
      console.log('FORCE FULL SYNC REQUESTED FROM POPUP');
      log('Received forceFullSync action - performing complete refresh');

      try {
        // Immediately send a response to acknowledge receipt
        sendResponse({ received: true, processing: true });

        // Perform the force sync immediately
        forceFullSync()
          .then(success => {
            log('forceFullSync completed with status:', success);
            console.log('FORCE FULL SYNC COMPLETED:', success);

            // Reload all web app tabs to ensure they're in sync
            reloadWebAppTabs();

            // Update last sync time with success status
            const now = Date.now();
            chrome.storage.local.set({
              lastSyncTime: now,
              lastSyncSuccess: true,
              lastSyncMessage: `Synced ${muteRules.length} rules`
            });
          })
          .catch(error => {
            log('forceFullSync failed with error:', error);
            console.error('FORCE FULL SYNC FAILED:', error);

            // Update last sync time with error status
            const now = Date.now();
            chrome.storage.local.set({
              lastSyncTime: now,
              lastSyncSuccess: false,
              lastSyncMessage: String(error)
            });
          });
      } catch (error) {
        console.error('Error handling forceFullSync:', error);
      }

      // Return false since we've already sent the response
      return false;
      break;

    case 'hardReloadExtension':
      // This action is no longer used, but kept for backward compatibility
      log('Received hardReloadExtension action (deprecated)');
      sendResponse({ success: true, message: 'Using forceFullSync instead' });

      // Just do a force sync instead
      forceFullSync()
        .then(() => {
          log('forceFullSync completed');
        })
        .catch(error => {
          log('forceFullSync failed with error:', error);
        });

      return false; // Don't keep the message channel open
      break;

    case 'forceRefresh':
      log('Received forceRefresh action - performing complete data refresh');

      // This is a simpler, more reliable approach that doesn't try to reload the extension
      // Instead, it forces a complete refresh of all data and notifies all tabs

      // Step 1: Force a full sync with the server
      forceFullSync()
        .then(success => {
          log('Force sync completed with status:', success);

          // Step 2: Reload all web app tabs to ensure they have the latest data
          reloadWebAppTabs();

          // Step 3: Notify all content scripts to refresh their data
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              try {
                chrome.tabs.sendMessage(tab.id, {
                  action: 'refreshData',
                  timestamp: Date.now()
                });
              } catch (error) {
                // Ignore errors from tabs that don't have the content script
              }
            });
          });

          // Step 4: Update the last sync time
          const now = Date.now();
          chrome.storage.local.set({
            lastSyncTime: now,
            lastRefreshTime: now
          });

          // Step 5: Send success response
          sendResponse({
            success: true,
            message: 'Complete data refresh performed',
            timestamp: now
          });
        })
        .catch(error => {
          log('Force refresh failed:', error);
          sendResponse({ success: false, error: String(error) });
        });

      return true; // Keep the message channel open for async response
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
  log('Saving mute rules to storage, count:', muteRules.length);

  // Log the first rule for debugging
  if (muteRules.length > 0) {
    log('First rule details:', JSON.stringify(muteRules[0]));
  }

  // Make sure we're saving a valid array
  const rulesToSave = Array.isArray(muteRules) ? muteRules : [];

  chrome.storage.local.set({ muteRules: rulesToSave }, () => {
    log('Saved mute rules to storage');

    // Verify the save worked by reading back from storage
    chrome.storage.local.get(['muteRules'], (result) => {
      log('Verified rules in storage:', result.muteRules ? result.muteRules.length : 0);
    });
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

  // Mark as not synced with server yet
  rule.serverSynced = false;

  // Add the rule
  muteRules.push(rule);

  // Save to storage
  saveMuteRules();

  // Notify content scripts
  notifyContentScripts();

  log('Added mute rule:', rule);

  // Trigger sync with server to ensure web app is updated
  log('Syncing with server after rule addition');
  syncWithWebApp().then(success => {
    log('Sync after addition completed with status:', success ? 'success' : 'failed');
  });
}

/**
 * Remove a mute rule
 */
async function removeMuteRule(ruleId) {
  log('Removing mute rule with ID:', ruleId);

  // Store the rule before removing it (for potential recovery)
  const ruleToRemove = muteRules.find(rule => rule.id === ruleId);

  if (!ruleToRemove) {
    log('Rule not found with ID:', ruleId);
    return false;
  }

  log('Found rule to remove:', JSON.stringify(ruleToRemove));

  try {
    // First, try to delete the rule directly from the server using the dedicated endpoint
    // This is more reliable than the sync endpoint for deletions
    const authData = await chrome.storage.local.get(['authToken']);
    const authToken = authData.authToken;

    if (authToken) {
      log('Calling dedicated delete endpoint for rule:', ruleId);

      try {
        const deleteResponse = await fetch(`${config.webAppUrl}/api/supabase-mute-rules/delete-rule?id=${ruleId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          credentials: 'include'
        });

        if (deleteResponse.ok) {
          log('Rule successfully deleted from server via dedicated endpoint');
        } else {
          const errorText = await deleteResponse.text();
          log('Error deleting rule via dedicated endpoint:', errorText);

          // If it's an auth error, handle it
          if (deleteResponse.status === 401 || deleteResponse.status === 403) {
            log('Authentication error detected in DELETE request. Token may be expired.');
            await chrome.storage.local.remove(['authToken', 'user']);
            chrome.runtime.sendMessage({
              action: 'authError',
              error: 'Your session has expired. Please sign in again.'
            });
          }
        }
      } catch (deleteError) {
        log('Error calling delete endpoint:', deleteError);
      }
    }

    // Now remove the rule locally regardless of server response
    // Find and remove the rule
    const initialLength = muteRules.length;
    muteRules = muteRules.filter(rule => rule.id !== ruleId);

    // If a rule was removed, save and notify
    if (muteRules.length < initialLength) {
      saveMuteRules();
      notifyContentScripts();
      log('Removed mute rule from local storage:', ruleId);

      // Also sync with server to ensure everything is in sync
      // This is a backup in case the direct deletion failed
      log('Syncing with server after rule removal using special deletion sync');

      // Force an immediate sync with the server using our special deletion sync
      const success = await syncAfterDeletion();
      log('Sync after removal completed with status:', success ? 'success' : 'failed');

      // Reload any open web app tabs to keep them in sync
      reloadWebAppTabs();

      return true;
    }

    log('Rule not found or already removed');
    return false;
  } catch (error) {
    log('Error in removeMuteRule:', error);
    return false;
  }
}

/**
 * Reload any open web app tabs to keep them in sync with the extension
 */
function reloadWebAppTabs() {
  log('Checking for open web app tabs to reload...');

  // Get the web app URL without trailing slash for comparison
  const webAppUrl = config.webAppUrl.replace(/\/$/, '');

  // Find all tabs that match the web app URL
  chrome.tabs.query({}, (tabs) => {
    let reloadedCount = 0;

    tabs.forEach(tab => {
      // Check if this tab is the web app
      if (tab.url && tab.url.startsWith(webAppUrl)) {
        log('Found web app tab to reload:', tab.url);

        // Reload the tab
        chrome.tabs.reload(tab.id);
        reloadedCount++;
      }
    });

    log(`Reloaded ${reloadedCount} web app tabs`);
  });
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
 * Check for rules deleted in the web app
 * This is a critical function to prevent the extension from re-adding rules that were deleted in the web app
 */
async function checkForWebAppDeletions() {
  log('Checking for rules deleted in web app...');

  try {
    // Check if we have an auth token
    const authData = await chrome.storage.local.get(['authToken', 'user']);
    const authToken = authData.authToken;
    const user = authData.user;

    if (!authToken) {
      log('No auth token found, skipping deletion check');
      return false;
    }

    // Get all rule IDs that have been synced with the server
    const syncedRuleIds = muteRules
      .filter(rule => rule.serverSynced)
      .map(rule => rule.id);

    if (syncedRuleIds.length === 0) {
      log('No synced rules to check for deletions');
      return true;
    }

    log('Checking for deletions of', syncedRuleIds.length, 'synced rules');

    // Call the check-deletions endpoint
    const response = await fetch(`${config.webAppUrl}/api/supabase-mute-rules/check-deletions?ids=${syncedRuleIds.join(',')}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('Error checking for deletions:', errorText);
      return false;
    }

    const data = await response.json();

    if (data.success && data.deletedRuleIds && data.deletedRuleIds.length > 0) {
      log('Found', data.deletedRuleIds.length, 'rules deleted in web app:', data.deletedRuleIds);

      // Remove these rules from local storage
      muteRules = muteRules.filter(rule => !data.deletedRuleIds.includes(rule.id));

      // Save changes to storage
      saveMuteRules();

      // Notify content scripts
      notifyContentScripts();

      log('Successfully removed rules that were deleted in web app');
      return true;
    }

    log('No rules found that were deleted in web app');
    return true;
  } catch (error) {
    log('Error checking for web app deletions:', error);
    return false;
  }
}

/**
 * Sync mute rules with the SilentZone web app
 */
async function syncWithWebApp() {
  log('Syncing with web app...');

  try {
    // First, check for rules deleted in the web app
    // This is critical to prevent the extension from re-adding rules that were deleted in the web app
    await checkForWebAppDeletions();

    // Check if we have an auth token
    const authData = await chrome.storage.local.get(['authToken', 'user']);
    const authToken = authData.authToken;
    const user = authData.user;

    log('Auth token:', authToken ? 'Found' : 'Not found');
    log('User:', user ? user.email : 'Not found');

    if (!authToken) {
      log('No auth token found, skipping sync');
      return false;
    }

    // Make API call to sync with web app using service role endpoint
    log('Making API call to:', `${config.webAppUrl}/api/supabase-mute-rules/sync-with-service-role`);
    log('With auth token:', authToken.substring(0, 10) + '...');
    log('Sending client rules:', muteRules.length);

    // IMPORTANT: First, get the current rules from the server without sending our local rules
    // This prevents accidentally deleting rules that exist on the server but not in our extension
    try {
      // First, just get the rules from the server
      const getResponse = await fetch(`${config.webAppUrl}/api/supabase-mute-rules/sync-with-service-role`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-sync-type': 'initial' // Mark this as an initial sync to prevent accidental deletions
        },
        credentials: 'include'
      });

      if (!getResponse.ok) {
        const errorText = await getResponse.text();
        log('Error getting rules from server:', errorText);

        // Check if this is an authentication error (401 Unauthorized)
        if (getResponse.status === 401 || getResponse.status === 403) {
          log('Authentication error detected. Token may be expired.');

          // Clear the stored auth token and user data
          await chrome.storage.local.remove(['authToken', 'user']);
          log('Cleared expired authentication data');

          // Notify any open popups about the auth error
          chrome.runtime.sendMessage({
            action: 'authError',
            error: 'Your session has expired. Please sign in again.'
          });

          return false;
        }

        throw new Error(`Server responded with ${getResponse.status}: ${errorText}`);
      }

      const getData = await getResponse.json();
      log('GET response data:', getData ? 'Received' : 'Empty');
      log('Server rules count:', getData.serverRules ? getData.serverRules.length : 0);

      // CRITICAL FIX: Check for web app deletions
      // If we have rules locally but they don't exist on the server, they were likely deleted in the web app
      if (getData.serverRules && muteRules.length > 0) {
        log('Checking for rules deleted in web app...');

        // Create a set of server rule IDs for quick lookup
        const serverRuleIds = new Set(getData.serverRules.map(rule => rule.id));

        // Find rules that exist locally but not on the server
        const localRulesToDelete = muteRules.filter(rule => {
          // Only consider rules that were previously synced with the server
          if (!rule.serverSynced) {
            return false;
          }

          // Check if this rule exists on the server
          return !serverRuleIds.has(rule.id);
        });

        // If we found rules to delete, remove them locally
        if (localRulesToDelete.length > 0) {
          log(`Found ${localRulesToDelete.length} rules that were deleted in web app, removing locally`);

          // Remove these rules from local storage
          muteRules = muteRules.filter(rule => {
            // Keep rules that are not in the delete list
            return !localRulesToDelete.some(deleteRule => deleteRule.id === rule.id);
          });

          // Save changes to storage
          saveMuteRules();

          // Notify content scripts
          notifyContentScripts();

          log('Successfully removed rules that were deleted in web app');
        } else {
          log('No rules found that were deleted in web app');
        }
      }

      // If we have server rules but no local rules, use the server rules
      if (getData.serverRules && getData.serverRules.length > 0 && muteRules.length === 0) {
        log('Found rules on server but none locally, using server rules');

        // Convert server rules to extension format
        const serverRules = getData.serverRules.map(rule => {
          // Handle platforms field
          let platforms = [];
          if (Array.isArray(rule.platforms)) {
            platforms = rule.platforms;
          } else if (rule.platforms && typeof rule.platforms === 'object') {
            platforms = Object.values(rule.platforms);
          }

          return {
            id: rule.id,
            keywords: Array.isArray(rule.keywords) ? rule.keywords : [String(rule.keywords || 'unknown')],
            platforms: platforms.map(p => typeof p === 'string' ? { name: p, id: p } : p),
            startTime: rule.startTime || rule.start_time || Date.now(),
            durationMs: rule.durationMs || rule.duration_ms || -1,
            useRegex: rule.useRegex || rule.use_regex || false,
            caseSensitive: rule.caseSensitive || rule.case_sensitive || false,
            matchWholeWord: rule.matchWholeWord || rule.match_whole_word || false,
            serverSynced: true
          };
        });

        // Update local rules with server rules
        muteRules = serverRules;

        // Save to storage
        saveMuteRules();

        // Notify content scripts
        notifyContentScripts();

        // Update last sync time
        const now = Date.now();
        chrome.storage.local.set({ lastSyncTime: now });

        log('Sync completed successfully (GET only)');
        return true;
      }

      // Now proceed with the normal sync
      // Make a deep copy of the rules to avoid any reference issues
      const rulesToSend = JSON.parse(JSON.stringify(muteRules));

      // Log the rules we're sending for debugging
      log('Sending rules to server:', rulesToSend.length);
      if (rulesToSend.length > 0) {
        log('First rule details:', JSON.stringify(rulesToSend[0]));
      }

      // Determine if this is a sync after deletion
      // We don't have access to req.headers here, so we'll use a different approach
      const isSyncAfterDeletion = false; // Default value

      const response = await fetch(`${config.webAppUrl}/api/supabase-mute-rules/sync-with-service-role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'x-sync-type': 'update', // Mark this as an update sync
          'x-after-deletion': isSyncAfterDeletion ? 'true' : 'false' // Indicate if this is after a deletion
        },
        body: JSON.stringify({
          clientRules: rulesToSend, // Send current rules to server
        }),
        credentials: 'include'
      });

      log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        log('Error response:', errorText);

        // Check if this is an authentication error (401 Unauthorized or 403 Forbidden)
        if (response.status === 401 || response.status === 403) {
          log('Authentication error detected in PUT request. Token may be expired.');

          // Clear the stored auth token and user data
          await chrome.storage.local.remove(['authToken', 'user']);
          log('Cleared expired authentication data');

          // Notify any open popups about the auth error
          chrome.runtime.sendMessage({
            action: 'authError',
            error: 'Your session has expired. Please sign in again.'
          });

          return false;
        }

        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      log('Response data:', data ? 'Received' : 'Empty');
      log('Full response data:', JSON.stringify(data));
      log('Server rules:', data.serverRules ? data.serverRules.length : 0);

      if (data.serverRules && data.serverRules.length > 0) {
        log('First rule details:', JSON.stringify(data.serverRules[0]));
      } else {
        log('No server rules received');
      }

      if (data.success && data.serverRules) {
        // Check if we have ID mappings from client to server
        if (data.idMapping && Object.keys(data.idMapping).length > 0) {
          log('Received ID mappings:', Object.keys(data.idMapping).length);

          // Update any local rules with their server IDs
          for (let i = 0; i < muteRules.length; i++) {
            const clientId = muteRules[i].id;
            if (data.idMapping[clientId]) {
              log(`Updating rule ID from ${clientId} to ${data.idMapping[clientId]}`);
              muteRules[i].id = data.idMapping[clientId];
              muteRules[i].serverSynced = true;
            }
          }
        }

        // Convert server rules to extension format
        const convertedRules = data.serverRules.map(rule => {
          log('Processing rule:', rule.id, 'with keywords:', rule.keywords);

          // Handle platforms field
          let platforms = [];
          if (Array.isArray(rule.platforms)) {
            platforms = rule.platforms;
            log('Rule has array platforms:', platforms.length);
          } else if (rule.platforms && typeof rule.platforms === 'object') {
            // Convert object to array if needed
            platforms = Object.values(rule.platforms);
            log('Rule has object platforms, converted to array:', platforms.length);
          } else {
            log('Rule has no valid platforms, using empty array');
          }

          // Create standardized rule object
          return {
            id: rule.id,
            keywords: Array.isArray(rule.keywords) ? rule.keywords : [String(rule.keywords || 'unknown')],
            platforms: platforms.map(p => typeof p === 'string' ? { name: p, id: p } : p),
            startTime: rule.startTime || rule.start_time || Date.now(),
            durationMs: rule.durationMs || rule.duration_ms || -1,
            useRegex: rule.useRegex || rule.use_regex || false,
            caseSensitive: rule.caseSensitive || rule.case_sensitive || false,
            matchWholeWord: rule.matchWholeWord || rule.match_whole_word || false,
            serverSynced: true
          };
        });

        // Merge local rules with server rules
        // First, create a map of all server rule IDs
        const serverRuleIds = new Set(convertedRules.map(rule => rule.id));

        // Keep local rules that haven't been synced to the server yet
        const localRulesToKeep = muteRules.filter(rule => !serverRuleIds.has(rule.id) && !rule.serverSynced);

        if (localRulesToKeep.length > 0) {
          log(`Keeping ${localRulesToKeep.length} local rules that haven't been synced yet`);
        }

        // Combine server rules with unsynced local rules
        muteRules = [...convertedRules, ...localRulesToKeep];

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
    } catch (fetchError) {
      log('Fetch error:', fetchError);
      throw fetchError;
    }
  } catch (error) {
    log('Sync failed:', error);
    return false;
  }
}

/**
 * Force a full sync of all rules to the web app
 * This is used when we need to ensure all local rules are pushed to the server
 * and all server rules are pulled to the extension
 */
async function forceFullSync() {
  log('Forcing full sync of all rules to web app...');
  console.log('FORCE FULL SYNC STARTED');

  try {
    // First, check for rules deleted in the web app
    // This is critical to prevent the extension from re-adding rules that were deleted in the web app
    await checkForWebAppDeletions();

    // Check if we have an auth token
    const authData = await chrome.storage.local.get(['authToken', 'user']);
    const authToken = authData.authToken;
    const user = authData.user;

    log('Auth token:', authToken ? 'Found' : 'Not found');
    log('User:', user ? user.email : 'Not found');

    if (!authToken) {
      log('No auth token found, skipping sync');
      console.error('FORCE FULL SYNC FAILED: No auth token found');

      // Update last sync time with error
      const now = Date.now();
      chrome.storage.local.set({
        lastSyncTime: now,
        lastSyncSuccess: false,
        lastSyncMessage: 'No auth token found'
      });

      return false;
    }

    // Make a deep copy of the rules to avoid any reference issues
    const rulesToSend = JSON.parse(JSON.stringify(muteRules));

    // Mark all rules as not synced to force them to be sent to the server
    rulesToSend.forEach(rule => {
      rule.serverSynced = false;
    });

    log('Sending all rules to server for full sync:', rulesToSend.length);
    console.log(`FORCE FULL SYNC: Sending ${rulesToSend.length} rules to server`);

    if (rulesToSend.length > 0) {
      log('First rule details:', JSON.stringify(rulesToSend[0]));
    }

    // First, get the current rules from the server to check for deletions
    log('Step 1: Getting current rules from server...');
    console.log('FORCE FULL SYNC STEP 1: Getting current rules from server');

    try {
      const getResponse = await fetch(`${config.webAppUrl}/api/supabase-mute-rules/sync-with-service-role`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-sync-type': 'initial',
          'x-cache-bust': Date.now() // Add cache busting to prevent cached responses
        },
        credentials: 'include'
      });

      if (!getResponse.ok) {
        const errorText = await getResponse.text();
        log('Error getting rules from server during force sync:', errorText);
        console.error('FORCE FULL SYNC STEP 1 FAILED:', errorText);

        // Continue with the sync even if the GET request fails
      } else {
        const getData = await getResponse.json();
        log('GET response data for force sync:', getData ? 'Received' : 'Empty');
        log('Server rules count for force sync:', getData.serverRules ? getData.serverRules.length : 0);
        console.log(`FORCE FULL SYNC STEP 1 SUCCESS: Got ${getData.serverRules ? getData.serverRules.length : 0} rules from server`);

        // Check for rules deleted in web app
        if (getData.serverRules && muteRules.length > 0) {
          log('Checking for rules deleted in web app during force sync...');

          // Create a set of server rule IDs for quick lookup
          const serverRuleIds = new Set(getData.serverRules.map(rule => rule.id));

          // Find rules that exist locally but not on the server
          const localRulesToDelete = muteRules.filter(rule => {
            // Only consider rules that were previously synced with the server
            if (!rule.serverSynced) {
              return false;
            }

            // Check if this rule exists on the server
            return !serverRuleIds.has(rule.id);
          });

          // If we found rules to delete, remove them locally
          if (localRulesToDelete.length > 0) {
            log(`Found ${localRulesToDelete.length} rules that were deleted in web app, removing locally during force sync`);
            console.log(`FORCE FULL SYNC: Removing ${localRulesToDelete.length} rules that were deleted in web app`);

            // Remove these rules from local storage
            muteRules = muteRules.filter(rule => {
              // Keep rules that are not in the delete list
              return !localRulesToDelete.some(deleteRule => deleteRule.id === rule.id);
            });

            // Update the rules to send
            const rulesToSend = JSON.parse(JSON.stringify(muteRules));

            // Mark all rules as not synced to force them to be sent to the server
            rulesToSend.forEach(rule => {
              rule.serverSynced = false;
            });

            log('Updated rules to send after removing deleted rules:', rulesToSend.length);
          }
        }
      }
    } catch (getError) {
      log('Error in GET request during force sync:', getError);
      console.error('FORCE FULL SYNC STEP 1 ERROR:', getError);
      // Continue with the sync even if the GET request fails
    }

    // Step 2: Send our rules to the server
    log('Step 2: Sending rules to server...');
    console.log('FORCE FULL SYNC STEP 2: Sending rules to server');

    // Make API call to sync with web app using service role endpoint
    const response = await fetch(`${config.webAppUrl}/api/supabase-mute-rules/sync-with-service-role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-sync-type': 'full-sync',
        'x-force-sync': 'true',
        'x-cache-bust': Date.now() // Add cache busting to prevent cached responses
      },
      body: JSON.stringify({
        clientRules: rulesToSend,
        forceSync: true
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('Error response:', errorText);
      console.error('FORCE FULL SYNC STEP 2 FAILED:', errorText);

      // Update last sync time with error
      const now = Date.now();
      chrome.storage.local.set({
        lastSyncTime: now,
        lastSyncSuccess: false,
        lastSyncMessage: errorText || 'Server error'
      });

      return false;
    }

    const data = await response.json();
    log('Server response:', data);
    console.log('FORCE FULL SYNC STEP 2 RESPONSE:', data.success ? 'SUCCESS' : 'FAILED');

    if (data.success) {
      log('Full sync completed successfully');
      console.log('FORCE FULL SYNC STEP 3: Processing server response');

      // ALWAYS update local rules with server rules
      // This is critical to ensure the extension and web app are in sync
      log('Received updated rules from server:', data.serverRules ? data.serverRules.length : 0);
      console.log(`FORCE FULL SYNC: Received ${data.serverRules ? data.serverRules.length : 0} rules from server`);

      if (data.serverRules && data.serverRules.length > 0) {
        // Convert server rules to extension format
        const convertedRules = data.serverRules.map(rule => ({
          id: rule.id,
          keywords: Array.isArray(rule.keywords) ? rule.keywords : [String(rule.keywords || 'unknown')],
          platforms: Array.isArray(rule.platforms) ?
            rule.platforms.map(p => typeof p === 'string' ? { name: p, id: p } : p) :
            [{ name: 'All Platforms', id: 'all' }],
          startTime: rule.startTime || rule.start_time || Date.now(),
          durationMs: rule.durationMs || rule.duration_ms || -1,
          useRegex: rule.useRegex || rule.use_regex || false,
          caseSensitive: rule.caseSensitive || rule.case_sensitive || false,
          matchWholeWord: rule.matchWholeWord || rule.match_whole_word || false,
          serverSynced: true
        }));

        // Update local rules - ALWAYS use server rules as source of truth
        muteRules = convertedRules;

        log('Updated local rules with server rules, new count:', muteRules.length);
        console.log(`FORCE FULL SYNC: Updated local rules, new count: ${muteRules.length}`);
      } else {
        // If server has no rules, clear local rules that were synced
        // but keep any unsynced local rules
        const unsynced = muteRules.filter(rule => !rule.serverSynced);
        log('Server has no rules. Keeping only unsynced local rules:', unsynced.length);
        console.log(`FORCE FULL SYNC: Server has no rules. Keeping ${unsynced.length} unsynced local rules`);
        muteRules = unsynced;
      }

      // Save to storage
      saveMuteRules();
      console.log('FORCE FULL SYNC: Saved rules to storage');

      // Notify content scripts
      notifyContentScripts();
      console.log('FORCE FULL SYNC: Notified content scripts');

      // Update last sync time with success
      const now = Date.now();
      chrome.storage.local.set({
        lastSyncTime: now,
        lastSyncSuccess: true,
        lastSyncMessage: `Synced ${muteRules.length} rules`
      });
      console.log(`FORCE FULL SYNC: Updated last sync time to ${new Date(now).toLocaleTimeString()}`);

      log('Force full sync completed successfully');
      console.log('FORCE FULL SYNC COMPLETED SUCCESSFULLY');
      return true;
    } else {
      log('Full sync failed:', data.error || 'Unknown error');
      console.error('FORCE FULL SYNC FAILED:', data.error || 'Unknown error');

      // Update last sync time with error
      const now = Date.now();
      chrome.storage.local.set({
        lastSyncTime: now,
        lastSyncSuccess: false,
        lastSyncMessage: data.error || 'Unknown error'
      });

      return false;
    }
  } catch (error) {
    log('Full sync failed:', error);
    console.error('FORCE FULL SYNC FAILED WITH EXCEPTION:', error);

    // Update last sync time with error
    const now = Date.now();
    chrome.storage.local.set({
      lastSyncTime: now,
      lastSyncSuccess: false,
      lastSyncMessage: String(error)
    });

    return false;
  }
}

/**
 * Sync with web app after rule deletion
 * This is a special version of syncWithWebApp that explicitly marks the sync
 * as being after a deletion, which helps the server handle it properly
 */
async function syncAfterDeletion() {
  log('Syncing with web app after rule deletion...');

  try {
    // Check if we have an auth token
    const authData = await chrome.storage.local.get(['authToken', 'user']);
    const authToken = authData.authToken;
    const user = authData.user;

    log('Auth token:', authToken ? 'Found' : 'Not found');
    log('User:', user ? user.email : 'Not found');

    if (!authToken) {
      log('No auth token found, skipping sync');
      return false;
    }

    // Make a deep copy of the rules to avoid any reference issues
    const rulesToSend = JSON.parse(JSON.stringify(muteRules));

    // Log the rules we're sending for debugging
    log('Sending rules to server after deletion:', rulesToSend.length);
    if (rulesToSend.length > 0) {
      log('First rule details:', JSON.stringify(rulesToSend[0]));
    }

    // Make API call to sync with web app using service role endpoint
    const response = await fetch(`${config.webAppUrl}/api/supabase-mute-rules/sync-with-service-role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-sync-type': 'update',
        'x-after-deletion': 'true' // Explicitly mark this as after a deletion
      },
      body: JSON.stringify({
        clientRules: rulesToSend, // Send current rules to server
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('Error response:', errorText);
      return false;
    }

    const data = await response.json();

    if (data.success) {
      log('Sync after deletion completed successfully');
      return true;
    } else {
      log('Sync after deletion failed:', data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    log('Sync after deletion failed:', error);
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
