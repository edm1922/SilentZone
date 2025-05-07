/**
 * SilentZone Content Script
 *
 * This script runs on web pages and is responsible for:
 * 1. Scanning the page for content matching muted keywords
 * 2. Hiding or blurring content that matches mute rules
 * 3. Communicating with the background script
 */

// Configuration
const config = {
  scanInterval: 1000, // How often to scan for new content (in ms)
  blurAmount: '8px',  // How much to blur content
  debugMode: true,   // Enable console logs for debugging
  webAppUrl: 'http://localhost:9002' // URL of the SilentZone web app
};

// Store for mute rules
let muteRules = [];
let currentPlatform = detectPlatform();
let isActive = true; // Default to active

// Initialize when the content script loads
initialize();

/**
 * Initialize the content script
 */
function initialize() {
  log('SilentZone content script initialized');

  // Load extension state (active/paused)
  chrome.storage.local.get(['isActive'], (result) => {
    if (result.isActive !== undefined) {
      isActive = result.isActive;
      log('Extension active state:', isActive ? 'Active' : 'Paused');
    }

    // Request mute rules from background script
    chrome.runtime.sendMessage({ action: 'getMuteRules' }, (response) => {
      if (response && response.muteRules) {
        muteRules = response.muteRules;
        log('Received mute rules:', muteRules);

        // If extension is paused, make sure we don't show any warnings
        if (!isActive) {
          log('Extension is paused on initialization, ensuring no warnings are shown');
          // Remove any existing warnings
          unmutePage();
        } else {
          log('Extension is active on initialization, starting content scanner');
        }

        // Start scanning the page
        startContentScanner();
      }
    });
  });

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateMuteRules') {
      muteRules = message.muteRules;
      log('Updated mute rules:', muteRules);

      // Re-scan the page with new rules
      scanPage();
      sendResponse({ success: true });
    }
    else if (message.action === 'refreshData') {
      log('Received refreshData message, timestamp:', message.timestamp);

      // Request fresh mute rules from background script
      chrome.runtime.sendMessage({ action: 'getMuteRules' }, (response) => {
        if (response && response.muteRules) {
          muteRules = response.muteRules;
          log('Refreshed mute rules:', muteRules);

          // Re-scan the page with new rules
          scanPage();
        }
      });

      sendResponse({ success: true });
    }
    else if (message.action === 'updateActiveState') {
      isActive = message.isActive;
      log('Updated active state:', isActive ? 'Active' : 'Paused');

      if (isActive) {
        // If we're now active, scan the page to apply rules
        log('Extension is now active, scanning page to apply rules');
        scanPage();
      } else {
        // If we're now paused, unmute all elements and remove warnings
        log('Extension is now paused, unmuting all elements and removing warnings');

        // FORCE REMOVE ALL WARNINGS IMMEDIATELY
        const pageWarnings = document.querySelectorAll('.silent-zone-page-warning');
        if (pageWarnings.length > 0) {
          log(`Found ${pageWarnings.length} page warnings, removing them immediately`);
          pageWarnings.forEach(warning => {
            warning.remove();
          });
        }

        // Restore scrolling
        document.body.style.overflow = '';

        // Then do the regular unmute
        unmutePage();
      }

      sendResponse({ success: true });
    }
    return true; // Keep the message channel open for async responses
  });

  // Listen for web app changes if we're on the web app page
  if (window.location.href.includes(config.webAppUrl) ||
      window.location.hostname === 'localhost' ||
      window.location.hostname.includes('silentzone')) {

    log('Detected SilentZone web app, setting up change listeners');

    // Listen for custom events from the web app
    window.addEventListener('silentzone_data_changed', (event) => {
      log('Received data change event from web app:', event.detail);

      // Reload the extension data
      chrome.runtime.sendMessage({ action: 'forceFullSync' }, (response) => {
        log('Force sync response after web app change:', response);
      });
    });

    // Also check localStorage periodically for changes
    setInterval(() => {
      const changeTimestamp = localStorage.getItem('silentzone_changes_timestamp');
      if (changeTimestamp) {
        const timestamp = parseInt(changeTimestamp);
        const now = Date.now();

        // Only process recent changes (within the last 5 seconds)
        if (now - timestamp < 5000) {
          log('Detected recent change in web app via localStorage');

          // Clear the timestamp to avoid processing it again
          localStorage.removeItem('silentzone_changes_timestamp');

          // Reload the extension data
          chrome.runtime.sendMessage({ action: 'forceFullSync' }, (response) => {
            log('Force sync response after localStorage change:', response);
          });
        }
      }
    }, 2000); // Check every 2 seconds
  }
}

/**
 * Start the content scanner that periodically checks for new content
 */
function startContentScanner() {
  // Perform initial scan
  scanPage();

  // Set up mutation observer to detect DOM changes
  const observer = new MutationObserver((mutations) => {
    scanPage();
  });

  // Start observing the document with the configured parameters
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

/**
 * Scan the page for content matching mute rules
 */
function scanPage() {
  log('Scanning page for muted content, extension active:', isActive);

  // If extension is paused, unmute everything and exit
  if (!isActive) {
    log('Extension is paused, unmuting everything and exiting scan');
    unmutePage();

    // Make sure no page-level warnings are visible
    const pageWarnings = document.querySelectorAll('.silent-zone-page-warning');
    if (pageWarnings.length > 0) {
      log(`Found ${pageWarnings.length} page warnings during scan while paused, removing them`);
      pageWarnings.forEach(warning => {
        warning.remove();
      });
      // Restore scrolling
      document.body.style.overflow = '';
    }

    return;
  }

  // Get all text-containing elements
  const textElements = getTextElements();

  // Get the context of the page (title, meta description, etc.)
  const pageContext = getPageContext();

  // First, check if the entire page should be muted based on its context
  const pageMatchedRule = findMatchingRule(pageContext);
  if (pageMatchedRule) {
    log('Page context matches mute rule:', pageMatchedRule);
    // Consider showing a page-level warning instead of muting individual elements
    showPageLevelWarning(pageMatchedRule);
    return; // Skip individual element scanning
  }

  // Check each element against mute rules
  textElements.forEach(element => {
    // Get the element's text
    const elementText = element.textContent;

    // Get the element's context (surrounding text, parent elements, etc.)
    const elementContext = getElementContext(element);

    // Combine element text with its context for better matching
    const combinedText = elementText + ' ' + elementContext;

    // Check if this element matches any mute rules
    const matchedRule = findMatchingRule(combinedText);

    if (matchedRule) {
      // This content should be muted
      muteElement(element, matchedRule);
    } else {
      // Make sure previously muted content is restored if rules changed
      unmuteElement(element);
    }
  });
}

/**
 * Get the context of the current page
 */
function getPageContext() {
  let context = '';

  // Add page title
  if (document.title) {
    context += document.title + ' ';
  }

  // Add meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription && metaDescription.getAttribute('content')) {
    context += metaDescription.getAttribute('content') + ' ';
  }

  // Add meta keywords
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords && metaKeywords.getAttribute('content')) {
    context += metaKeywords.getAttribute('content') + ' ';
  }

  // Add Open Graph title and description
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && ogTitle.getAttribute('content')) {
    context += ogTitle.getAttribute('content') + ' ';
  }

  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription && ogDescription.getAttribute('content')) {
    context += ogDescription.getAttribute('content') + ' ';
  }

  // Add URL path (can contain relevant keywords)
  context += window.location.pathname + ' ';

  // Add h1 headings
  document.querySelectorAll('h1').forEach(h1 => {
    context += h1.textContent + ' ';
  });

  return context;
}

/**
 * Get the context of an element
 */
function getElementContext(element) {
  let context = '';

  // Add parent element text (excluding the element's own text)
  const parent = element.parentElement;
  if (parent) {
    // Clone parent to avoid modifying the actual DOM
    const parentClone = parent.cloneNode(true);

    // Remove the original element from the clone
    const elementInParent = parentClone.querySelector(':scope > *:nth-child(' + Array.from(parent.children).indexOf(element) + 1 + ')');
    if (elementInParent) {
      elementInParent.remove();
    }

    context += parentClone.textContent + ' ';
  }

  // Add heading context if the element is within a section with a heading
  let currentElement = element;
  while (currentElement && currentElement !== document.body) {
    const nearestHeading = currentElement.querySelector('h1, h2, h3, h4, h5, h6');
    if (nearestHeading) {
      context += nearestHeading.textContent + ' ';
      break;
    }
    currentElement = currentElement.parentElement;
  }

  // Add nearby link text
  const nearbyLinks = getNearbyElements(element, 'a', 3);
  nearbyLinks.forEach(link => {
    context += link.textContent + ' ';
  });

  return context;
}

/**
 * Get nearby elements of a specific type
 */
function getNearbyElements(element, selector, maxDistance) {
  const nearby = [];

  // Check siblings
  let sibling = element.previousElementSibling;
  let distance = 0;
  while (sibling && distance < maxDistance) {
    if (sibling.matches(selector)) {
      nearby.push(sibling);
    }
    sibling = sibling.previousElementSibling;
    distance++;
  }

  sibling = element.nextElementSibling;
  distance = 0;
  while (sibling && distance < maxDistance) {
    if (sibling.matches(selector)) {
      nearby.push(sibling);
    }
    sibling = sibling.nextElementSibling;
    distance++;
  }

  return nearby;
}

/**
 * Show a page-level warning for muted content
 */
function showPageLevelWarning(rule) {
  // If extension is paused, don't show any warnings
  if (!isActive) {
    log('Extension is paused, not showing page-level warning');
    return;
  }

  // Check if this page has been temporarily allowed by the user
  if (window.silentZonePageAllowed) {
    log('Page has been temporarily allowed by user, not showing warning');
    return;
  }

  // Check if warning already exists
  if (document.querySelector('.silent-zone-page-warning')) {
    return;
  }

  // Create warning element
  const warning = document.createElement('div');
  warning.className = 'silent-zone-page-warning';
  warning.innerHTML = `
    <div class="silent-zone-page-warning-content">
      <h2>Content Muted</h2>
      <p>This page contains content related to: "${rule.keywords.join(', ')}"</p>
      <div class="silent-zone-page-warning-buttons">
        <button class="silent-zone-page-warning-proceed">Proceed Anyway</button>
        <button class="silent-zone-page-warning-back">Go Back</button>
      </div>
    </div>
  `;

  // Style the warning
  warning.style.position = 'fixed';
  warning.style.top = '0';
  warning.style.left = '0';
  warning.style.width = '100%';
  warning.style.height = '100%';
  warning.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  warning.style.zIndex = '9999999';
  warning.style.display = 'flex';
  warning.style.alignItems = 'center';
  warning.style.justifyContent = 'center';

  // Add event listeners with direct DOM manipulation for maximum reliability
  const proceedButton = warning.querySelector('.silent-zone-page-warning-proceed');
  if (proceedButton) {
    proceedButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      // Force remove the warning
      warning.style.display = 'none';
      setTimeout(() => {
        if (warning.parentNode) {
          warning.parentNode.removeChild(warning);
        }
        log('User clicked Proceed Anyway, forcibly removed page-level warning');
      }, 10);

      // Restore scrolling immediately
      document.body.style.overflow = '';

      // Create a temporary allowlist for this page to prevent the warning from reappearing
      const currentUrl = window.location.href;
      log('Adding current URL to temporary allowlist:', currentUrl);

      // Set a flag to prevent re-showing the warning on this page
      window.silentZonePageAllowed = true;

      // Also set a flag in localStorage to persist across page refreshes
      try {
        localStorage.setItem('silentZonePageAllowed_' + window.location.hostname, 'true');
        log('Saved allowlist status to localStorage');
      } catch (e) {
        log('Failed to save to localStorage:', e);
      }

      return false;
    });
  }

  const backButton = warning.querySelector('.silent-zone-page-warning-back');
  if (backButton) {
    backButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      window.history.back();
      log('User clicked Go Back, navigating to previous page');
      return false;
    });
  }

  // Add to page
  document.body.appendChild(warning);

  // Prevent scrolling while warning is shown
  document.body.style.overflow = 'hidden';
}

/**
 * Find all elements that contain text content
 */
function getTextElements() {
  // Get platform-specific selectors
  const selectors = getPlatformSelectors(currentPlatform);

  // Use platform-specific selectors if available, otherwise use generic selectors
  const elements = Array.from(document.querySelectorAll(selectors))
    .filter(el => {
      // Filter out elements that don't have meaningful text
      const text = el.textContent.trim();
      return text.length > 0 && text.split(' ').length > 1; // At least 2 words
    })
    .filter(el => {
      // Filter out elements that are too small (likely UI elements, not content)
      const rect = el.getBoundingClientRect();
      return rect.width > 50 && rect.height > 15;
    });

  return elements;
}

/**
 * Get platform-specific selectors for content elements
 */
function getPlatformSelectors(platform) {
  const commonSelectors = 'p, article, .content, [role="article"]';

  // Platform-specific selectors
  const platformSelectors = {
    facebook: '.userContent, .userContentWrapper, [data-ad-preview="message"], [data-testid="post_message"], [role="article"]',
    twitter: '.tweet-text, [data-testid="tweetText"], article, [role="article"]',
    youtube: '#content-text, .ytd-video-secondary-info-renderer, .ytd-comment-renderer-text, .comment-renderer-text-content, .ytd-expander',
    reddit: '.entry .md, .Comment__body, [data-test-id="post-content"], .Post__content',
    tiktok: '.tiktok-1itcwxg-ImgPoster, .tiktok-1n8z9r7-DivContainer, .video-feed-item-desc',
    instagram: '.C4VMK, ._a9zs, .xdj266r, ._aacl',
    news: 'article, .article-body, .article-content, .story-body, .story-content, .entry-content, .post-content'
  };

  // Return platform-specific selectors if available, otherwise use common selectors
  return platformSelectors[platform] || commonSelectors;
}

/**
 * Check if text content matches any mute rule
 */
function findMatchingRule(text) {
  // Find the first matching rule
  return muteRules.find(rule => {
    // Check if rule applies to current platform
    if (!isRuleApplicableToPlatform(rule)) {
      return false;
    }

    // Check if rule is still active (not expired)
    if (isRuleExpired(rule)) {
      return false;
    }

    // Check if any keyword matches using advanced matching
    return rule.keywords.some(keyword => matchKeyword(text, keyword, rule));
  });
}

/**
 * Advanced keyword matching
 */
function matchKeyword(text, keyword, rule) {
  // If rule specifies regex matching, try that first
  if (rule && rule.useRegex) {
    try {
      // Create regex with appropriate flags
      const flags = rule.caseSensitive ? '' : 'i';
      const regex = new RegExp(keyword, flags);
      return regex.test(text);
    } catch (error) {
      // If regex is invalid, fall back to normal matching
      console.error('Invalid regex pattern:', keyword, error);
    }
  }

  // If rule specifies case sensitivity, respect that
  const compareText = (rule && rule.caseSensitive) ? text : text.toLowerCase();
  const compareKeyword = (rule && rule.caseSensitive) ? keyword : keyword.toLowerCase();

  // Check for whole word matching
  if (rule && rule.matchWholeWord) {
    const wordBoundaryRegex = new RegExp(`\\b${escapeRegExp(compareKeyword)}\\b`, rule.caseSensitive ? '' : 'i');
    return wordBoundaryRegex.test(compareText);
  }

  // Simple substring matching
  return compareText.includes(compareKeyword);
}

/**
 * Escape special characters for use in a regular expression
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if a rule applies to the current platform
 */
function isRuleApplicableToPlatform(rule) {
  // If rule applies to all platforms or specifically includes current platform
  return rule.platforms.some(platform =>
    platform.id === 'all' || platform.id === currentPlatform
  );
}

/**
 * Check if a rule has expired
 */
function isRuleExpired(rule) {
  const now = Date.now();
  const expiryTime = rule.startTime + rule.durationMs;
  return now > expiryTime;
}

/**
 * Apply muting effect to an element
 */
function muteElement(element, rule) {
  // Skip if already muted
  if (element.dataset.silentZoneMuted === 'true') {
    return;
  }

  // Mark as muted
  element.dataset.silentZoneMuted = 'true';

  // Store original styles for later restoration
  element.dataset.silentZoneOriginalFilter = element.style.filter;
  element.dataset.silentZoneOriginalOpacity = element.style.opacity;
  element.dataset.silentZoneOriginalPosition = element.style.position;

  // Apply blur effect
  element.style.filter = `blur(${config.blurAmount})`;
  element.style.opacity = '0.7';

  // Store the matched keywords for display
  const matchedKeywords = rule.keywords.filter(keyword =>
    matchKeyword(element.textContent.toLowerCase(), keyword.toLowerCase(), rule)
  );

  // Add warning overlay
  const overlay = document.createElement('div');
  overlay.className = 'silent-zone-overlay';

  // Generate a unique ID for the overlay
  const overlayId = 'silent-zone-overlay-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  overlay.id = overlayId;

  // Create warning content with more details
  overlay.innerHTML = `
    <div class="silent-zone-warning">
      <p>Content muted: Contains "${matchedKeywords.join(', ')}"</p>
      <button class="silent-zone-show-btn">Show Anyway</button>
    </div>
  `;

  // Position the overlay
  const rect = element.getBoundingClientRect();
  overlay.style.position = 'absolute';
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;

  // Add click handler to show button
  overlay.querySelector('.silent-zone-show-btn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    unmuteElement(element);
    overlay.remove();
  });

  // Add overlay to page
  document.body.appendChild(overlay);
  element.dataset.silentZoneOverlayId = overlayId;

  // Create a function to update overlay position
  const updatePositionFunction = function() {
    const newRect = element.getBoundingClientRect();
    const overlayElement = document.getElementById(overlayId);
    if (overlayElement) {
      overlayElement.style.top = `${newRect.top + window.scrollY}px`;
      overlayElement.style.left = `${newRect.left + window.scrollX}px`;
      overlayElement.style.width = `${newRect.width}px`;
      overlayElement.style.height = `${newRect.height}px`;
    }
  };

  // Store the function reference on the element
  element.updateOverlayPosition = updatePositionFunction;

  // Add event listeners for position updates
  window.addEventListener('resize', element.updateOverlayPosition);
  window.addEventListener('scroll', element.updateOverlayPosition);

  // Store event listeners for later removal
  element.dataset.silentZoneResizeListener = 'true';
  element.dataset.silentZoneScrollListener = 'true';
}

/**
 * Remove muting effect from an element
 */
function unmuteElement(element) {
  // Skip if not muted
  if (element.dataset.silentZoneMuted !== 'true') {
    return;
  }

  // Restore original styles
  element.style.filter = element.dataset.silentZoneOriginalFilter || '';
  element.style.opacity = element.dataset.silentZoneOriginalOpacity || '';
  element.style.position = element.dataset.silentZoneOriginalPosition || '';

  // Remove muted flag
  delete element.dataset.silentZoneMuted;

  // Remove overlay if it exists
  if (element.dataset.silentZoneOverlayId) {
    const overlay = document.getElementById(element.dataset.silentZoneOverlayId);
    if (overlay) {
      overlay.remove();
    }
    delete element.dataset.silentZoneOverlayId;
  }

  // Remove event listeners
  if (element.dataset.silentZoneResizeListener === 'true' && element.updateOverlayPosition) {
    window.removeEventListener('resize', element.updateOverlayPosition);
    delete element.dataset.silentZoneResizeListener;
  }

  if (element.dataset.silentZoneScrollListener === 'true' && element.updateOverlayPosition) {
    window.removeEventListener('scroll', element.updateOverlayPosition);
    delete element.dataset.silentZoneScrollListener;
  }

  // Clean up the function reference
  if (element.updateOverlayPosition) {
    delete element.updateOverlayPosition;
  }
}

/**
 * Detect which platform the current page belongs to
 */
function detectPlatform() {
  const hostname = window.location.hostname;

  if (hostname.includes('facebook.com')) return 'facebook';
  if (hostname.includes('youtube.com')) return 'youtube';
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
  if (hostname.includes('tiktok.com')) return 'tiktok';
  if (hostname.includes('reddit.com')) return 'reddit';
  if (hostname.includes('instagram.com')) return 'instagram';

  // Default to 'news' for other websites
  return 'news';
}

/**
 * Unmute all elements on the page
 */
function unmutePage() {
  log('Unmuting all elements due to paused state');

  // Find all muted elements
  const mutedElements = document.querySelectorAll('[data-silent-zone-muted="true"]');

  // Unmute each element
  mutedElements.forEach(element => {
    unmuteElement(element);
  });

  // Also remove any page-level warnings
  const pageWarnings = document.querySelectorAll('.silent-zone-page-warning');
  pageWarnings.forEach(warning => {
    warning.remove();
    log('Removed page-level warning due to paused state');
  });

  // Restore scrolling if it was disabled
  if (document.body.style.overflow === 'hidden') {
    document.body.style.overflow = '';
    log('Restored page scrolling');
  }

  // Force a re-scan of the page after a short delay to ensure all warnings are removed
  setTimeout(() => {
    log('Performing follow-up scan to ensure all warnings are removed');
    // Check again for any remaining warnings
    const remainingWarnings = document.querySelectorAll('.silent-zone-page-warning');
    if (remainingWarnings.length > 0) {
      log(`Found ${remainingWarnings.length} remaining warnings, removing them`);
      remainingWarnings.forEach(warning => {
        warning.remove();
      });

      // Make sure scrolling is restored
      document.body.style.overflow = '';
    }
  }, 500);
}

/**
 * Utility function for logging (only in debug mode)
 */
function log(...args) {
  if (config.debugMode) {
    console.log('[SilentZone]', ...args);
  }
}
