# Browser Extension Testing Guide

This document outlines the testing procedures for the SilentZone browser extension with Supabase integration.

## Prerequisites

1. A running instance of the SilentZone web application
2. The SilentZone browser extension installed in developer mode
3. Test user accounts in Supabase
4. Sample mute rules created in the web application

## Test Environment Setup

1. Ensure your web application is running with Supabase configuration
2. Load the browser extension in developer mode:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `browser-extension` directory
3. Create test mute rules with various configurations:
   - Different keywords and platforms
   - Various duration settings
   - Rules with advanced options (regex, case sensitivity, etc.)

## Test Cases

### 1. Extension Installation and Initialization

1. Install the extension in Chrome
2. Open the extension popup
3. Verify:
   - Extension loads without errors
   - Login form is displayed for unauthenticated users
   - UI elements render correctly

#### Expected Results
- Extension installs successfully
- Popup UI renders correctly
- No console errors on initialization

### 2. Authentication

#### Login Flow
1. Open the extension popup
2. Enter valid credentials
3. Submit the login form
4. Verify:
   - Success message is displayed
   - User information appears
   - Main extension UI is shown

#### Session Persistence
1. Log in to the extension
2. Close and reopen the browser
3. Open the extension popup
4. Verify:
   - User remains logged in
   - No re-authentication is required

#### Logout Flow
1. Log in to the extension
2. Click the logout button
3. Verify:
   - User is logged out
   - Login form is displayed
   - Protected features are not accessible

#### Expected Results
- Authentication flows work correctly
- Sessions persist appropriately
- Logout clears authentication state

### 3. Data Synchronization

#### Initial Sync
1. Create mute rules in the web application
2. Log in to the extension
3. Verify:
   - Rules are synchronized to the extension
   - All rule properties are correct
   - Rule count matches the web application

#### Manual Sync
1. Create a new rule in the web application
2. Click "Sync Now" in the extension
3. Verify:
   - New rule appears in the extension
   - Sync status updates
   - Last sync time updates

#### Background Sync
1. Create a new rule in the web application
2. Wait for the automatic sync interval
3. Verify:
   - New rule appears in the extension
   - No user interaction was required

#### Offline Handling
1. Log in to the extension
2. Disconnect from the internet
3. Attempt to sync
4. Verify:
   - Appropriate error message is displayed
   - Extension continues to function with cached rules
5. Reconnect to the internet and sync again
6. Verify:
   - Sync completes successfully
   - Rules are updated

#### Expected Results
- Data synchronizes correctly in all scenarios
- Offline mode works as expected
- Error handling is robust

### 4. Content Filtering

#### Basic Filtering
1. Create a mute rule for a specific keyword
2. Visit a webpage containing that keyword
3. Verify:
   - Content with the keyword is filtered (hidden or blurred)
   - Other content remains visible
   - Visual indicators show filtered content

#### Platform-Specific Filtering
1. Create rules for specific platforms (e.g., Twitter, Facebook)
2. Visit those platforms
3. Verify:
   - Rules apply only on the specified platforms
   - Platform detection works correctly

#### Advanced Filtering Options
1. Create rules with advanced options:
   - Regex patterns
   - Case sensitivity
   - Whole word matching
2. Visit pages with content that should match these patterns
3. Verify:
   - Filtering works according to the specified options
   - No false positives or negatives

#### Temporary Muting
1. Create rules with different duration settings
2. Verify:
   - Rules expire at the correct time
   - Expired rules no longer filter content
   - UI indicates remaining time correctly

#### Expected Results
- Content filtering works accurately
- Platform detection is reliable
- Advanced options function as expected
- Temporary muting respects duration settings

### 5. User Interface

#### Rule Display
1. Create multiple rules with various configurations
2. Open the extension popup
3. Verify:
   - Rules are displayed correctly
   - All relevant information is visible
   - Long lists of rules are navigable

#### Status Indicators
1. Toggle the extension on/off
2. Verify:
   - Status indicator updates correctly
   - Filtering behavior changes accordingly
3. Sync with the server
4. Verify:
   - Sync status indicators update correctly
   - Last sync time is displayed

#### Error Messages
1. Trigger various error conditions:
   - Invalid credentials
   - Network failures
   - Server errors
2. Verify:
   - Clear error messages are displayed
   - User can recover from errors
   - UI remains usable

#### Expected Results
- UI is intuitive and responsive
- Status indicators are clear and accurate
- Error messages are helpful and non-disruptive

### 6. Performance

#### Memory Usage
1. Monitor memory usage with the extension active
2. Visit pages with varying amounts of content
3. Verify:
   - Memory usage remains reasonable
   - No memory leaks occur over time

#### CPU Usage
1. Monitor CPU usage during content scanning
2. Visit pages with large amounts of content
3. Verify:
   - CPU spikes are minimal and brief
   - Background scanning doesn't impact browsing experience

#### Page Load Impact
1. Measure page load times with and without the extension
2. Compare results for various websites
3. Verify:
   - Extension adds minimal overhead to page loading
   - User experience is not degraded

#### Expected Results
- Extension is resource-efficient
- Performance impact is minimal
- User experience remains smooth

### 7. Integration with Web Application

#### Rule Creation Flow
1. Create a rule in the web application
2. Verify it appears in the extension
3. Create a rule via the extension (if supported)
4. Verify it appears in the web application

#### Rule Updates
1. Update a rule in the web application
2. Verify changes sync to the extension
3. Update a rule via the extension (if supported)
4. Verify changes sync to the web application

#### Rule Deletion
1. Delete a rule in the web application
2. Verify it's removed from the extension
3. Delete a rule via the extension
4. Verify it's removed from the web application

#### Expected Results
- Changes in either interface sync correctly
- Data consistency is maintained
- User experience is seamless across platforms

## Cross-Browser Testing

If the extension supports multiple browsers, repeat key tests on:
- Chrome
- Firefox
- Edge
- Safari (if applicable)

Verify that functionality and performance are consistent across browsers.

## Troubleshooting Common Issues

### Authentication Issues
- Check browser console for errors
- Verify that cookies and local storage are enabled
- Check for CORS issues in network requests

### Synchronization Problems
- Verify network connectivity
- Check authentication token validity
- Inspect network requests for errors

### Content Filtering Issues
- Check rule configuration
- Verify content scanning is working
- Check for changes in website structure that might affect selectors

## Reporting Bugs

When reporting issues, include:
1. Browser and version
2. Extension version
3. Steps to reproduce
4. Expected vs. actual behavior
5. Console logs and screenshots
6. Network request details if relevant

## Test Completion Checklist

- [ ] Extension installs and initializes correctly
- [ ] Authentication flows work as expected
- [ ] Data synchronization is reliable
- [ ] Content filtering is accurate
- [ ] UI is functional and intuitive
- [ ] Performance meets requirements
- [ ] Integration with web application is seamless
- [ ] Cross-browser compatibility is verified (if applicable)
