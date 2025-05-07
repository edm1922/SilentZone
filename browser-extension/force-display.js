// Force display script to directly modify the popup's DOM
// This script should be run in the browser console when inspecting the popup

function forceDisplay() {
  console.log('Forcing display of rules and fixing UI issues...');

  // First, check and fix the active/paused state
  fixActiveState();

  // Then force a sync with the server to ensure we have the latest rules
  chrome.runtime.sendMessage({ action: 'forceFullSync' }, (syncResponse) => {
    console.log('Initial force sync response:', syncResponse);

    // Add a small delay to ensure storage is updated
    setTimeout(() => {
      // Now get rules from storage after sync
      chrome.storage.local.get(['muteRules', 'isActive'], (result) => {
        console.log('Rules in storage after sync:', result.muteRules ? result.muteRules.length : 0);
        console.log('Active state:', result.isActive !== false ? 'Active' : 'Paused');

        // Make sure the active state is properly reflected in the UI
        updateActiveStateUI(result.isActive !== false);

        if (result.muteRules && result.muteRules.length > 0) {
          console.log('Rules found in storage:', JSON.stringify(result.muteRules, null, 2));

          // Force display of rules
          const muteList = document.getElementById('muteList');
          const emptyState = document.getElementById('emptyState');

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
              const item = document.createElement('div');
              item.className = 'mute-item';

              // Create platform badges HTML
              const platformsHtml = Array.isArray(rule.platforms) ? rule.platforms.map(platform => {
                const platformName = typeof platform === 'string' ? platform : (platform.name || platform.id || 'Unknown');
                return `<span class="platform-badge">${platformName}</span>`;
              }).join('') : '';

              // Calculate time remaining
              let timeRemainingText = 'Permanent';
              if (rule.durationMs > 0) {
                const expiryTime = rule.startTime + rule.durationMs;
                const now = Date.now();
                if (expiryTime > now) {
                  const daysRemaining = Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));
                  timeRemainingText = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
                } else {
                  timeRemainingText = 'Expired';
                }
              }

              // Set item HTML
              item.innerHTML = `
                <div class="mute-item-header">
                  <div class="mute-keywords">${rule.keywords.join(', ')}</div>
                  <button class="mute-remove" data-rule-id="${rule.id}">Remove</button>
                </div>
                <div class="mute-details">
                  <div>Time remaining: ${timeRemainingText}</div>
                  <div class="mute-platforms">
                    ${platformsHtml}
                  </div>
                  <div class="sync-status">
                    ${rule.serverSynced ? '<span class="synced">✓ Synced</span>' : '<span class="not-synced">⟳ Not synced</span>'}
                  </div>
                </div>
              `;

              // Add remove button event listener
              item.querySelector('.mute-remove').addEventListener('click', (e) => {
                const ruleId = e.target.getAttribute('data-rule-id');
                console.log('Removing rule with ID:', ruleId);

                // Send message to background script to remove the rule
                chrome.runtime.sendMessage({
                  action: 'removeMuteRule',
                  ruleId: ruleId
                }, (response) => {
                  console.log('Remove rule response:', response);

                  if (response && response.success) {
                    // Remove the item from the DOM
                    e.target.closest('.mute-item').remove();

                    // Check if there are any rules left
                    if (muteList.querySelectorAll('.mute-item').length === 0) {
                      // Show empty state if no rules left
                      emptyState.style.display = 'block';
                    }

                    // Force sync with server to ensure deletion is propagated
                    chrome.runtime.sendMessage({
                      action: 'syncNow'
                    }, (syncResponse) => {
                      console.log('Sync response after deletion:', syncResponse);
                    });
                  }
                });
              });

              muteList.appendChild(item);
            });

            console.log('Successfully displayed ' + result.muteRules.length + ' rules!');
          } else {
            console.error('Could not find muteList or emptyState elements');
          }
        } else {
          console.log('No rules found in storage');

          // Show empty state
          const emptyState = document.getElementById('emptyState');
          if (emptyState) {
            emptyState.style.display = 'block';
          }
        }
      });
    }, 1500); // 1500ms delay to ensure storage is updated
  });
}

// Fix the active/paused state
function fixActiveState() {
  chrome.storage.local.get(['isActive'], (result) => {
    const isActive = result.isActive !== false; // Default to active if undefined
    console.log('Current active state:', isActive ? 'Active' : 'Paused');
    
    // Update the UI
    updateActiveStateUI(isActive);
    
    // Make sure all tabs know about the current state
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        try {
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateActiveState',
            isActive: isActive
          });
        } catch (error) {
          // Ignore errors from tabs that don't have the content script
        }
      });
    });
    
    // Add event listener to toggle button if it exists
    const toggleBtn = document.getElementById('toggleBtn');
    if (toggleBtn) {
      console.log('Adding click listener to toggle button');
      toggleBtn.addEventListener('click', () => {
        const newState = !isActive;
        console.log('Toggling state to:', newState ? 'Active' : 'Paused');
        
        // Update storage
        chrome.storage.local.set({ isActive: newState }, () => {
          console.log('Saved new state to storage:', newState ? 'Active' : 'Paused');
          
          // Update UI
          updateActiveStateUI(newState);
          
          // Notify all content scripts
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              try {
                chrome.tabs.sendMessage(tab.id, {
                  action: 'updateActiveState',
                  isActive: newState
                });
              } catch (error) {
                // Ignore errors from tabs that don't have the content script
              }
            });
          });
        });
      });
    }
  });
}

// Update the active/paused state in the UI
function updateActiveStateUI(isActive) {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const toggleBtn = document.getElementById('toggleBtn');
  
  if (statusDot && statusText && toggleBtn) {
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
    console.log('Updated UI to reflect state:', isActive ? 'Active' : 'Paused');
  } else {
    console.error('Could not find status elements in the DOM');
  }
}

// Add some basic styles for sync status and improved visibility
const style = document.createElement('style');
style.textContent = `
  .sync-status {
    margin-top: 5px;
    font-size: 12px;
  }
  .synced {
    color: green;
  }
  .not-synced {
    color: orange;
  }
  .active {
    background-color: #10b981 !important;
  }
  .paused {
    background-color: #ef4444 !important;
  }
  #toggleBtn {
    cursor: pointer !important;
    opacity: 1 !important;
  }
  .silent-zone-page-warning {
    display: none !important;
  }
`;
document.head.appendChild(style);

// Run the force display function
forceDisplay();
