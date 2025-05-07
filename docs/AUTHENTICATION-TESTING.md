# Authentication Testing Guide

This document outlines the testing procedures for the SilentZone authentication system using Supabase.

## Prerequisites

1. A running instance of the SilentZone web application
2. The SilentZone browser extension installed
3. Access to the Supabase dashboard for your project
4. At least one test user account

## Test Environment Setup

1. Ensure your `.env.local` file contains the correct Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Load the browser extension in developer mode:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `browser-extension` directory

## Test Cases

### 1. User Registration

#### Web Application
1. Navigate to `/signup`
2. Enter a valid email and password
3. Submit the form
4. Verify:
   - Success message is displayed
   - User is redirected to the dashboard
   - User appears in Supabase Auth dashboard

#### Expected Results
- User account is created in Supabase
- User is automatically logged in
- User is redirected to the dashboard

### 2. User Login

#### Web Application
1. Navigate to `/login`
2. Enter valid credentials
3. Submit the form
4. Verify:
   - User is redirected to the dashboard
   - User information is displayed correctly

#### Browser Extension
1. Open the extension popup
2. Enter valid credentials in the login form
3. Submit the form
4. Verify:
   - Login success message is displayed
   - User information is displayed
   - Mute rules are loaded (if any)

#### Expected Results
- User is authenticated in both web app and extension
- Session is maintained between page refreshes
- Authentication token is stored securely

### 3. Password Reset

#### Web Application
1. Navigate to `/login`
2. Click "Forgot password?"
3. Enter the email address
4. Submit the form
5. Check the email inbox for reset instructions
6. Follow the link and set a new password
7. Verify:
   - Success message is displayed
   - User can log in with the new password

#### Expected Results
- Password reset email is sent
- User can set a new password
- User can log in with the new password

### 4. Session Persistence

#### Web Application
1. Log in to the web application
2. Close the browser and reopen it
3. Navigate to the SilentZone dashboard
4. Verify:
   - User remains logged in
   - Dashboard displays correctly

#### Browser Extension
1. Log in to the extension
2. Close and reopen the browser
3. Open the extension popup
4. Verify:
   - User remains logged in
   - Mute rules are still accessible

#### Expected Results
- Session persists across browser restarts
- No re-authentication is required

### 5. Logout

#### Web Application
1. Log in to the web application
2. Click the logout button
3. Verify:
   - User is redirected to the login page
   - Protected routes are no longer accessible

#### Browser Extension
1. Log in to the extension
2. Click the logout button
3. Verify:
   - Login form is displayed
   - Mute rules are no longer accessible

#### Expected Results
- User is logged out from the application
- Session is terminated
- Protected resources are no longer accessible

### 6. Cross-Platform Authentication

1. Log in to the web application
2. Open the browser extension
3. Verify:
   - Extension detects the web application session
   - User is automatically logged in to the extension

#### Expected Results
- Authentication state is synchronized between web app and extension
- User doesn't need to log in separately to the extension

### 7. Token Expiration and Refresh

1. Log in to the web application and extension
2. Wait for the token to expire (or manually expire it in Supabase)
3. Perform an action that requires authentication
4. Verify:
   - Token is refreshed automatically
   - User remains logged in
   - Action completes successfully

#### Expected Results
- Expired tokens are refreshed automatically
- User experience is not interrupted

### 8. Error Handling

#### Invalid Credentials
1. Attempt to log in with invalid credentials
2. Verify:
   - Appropriate error message is displayed
   - User remains on the login page

#### Account Lockout (if implemented)
1. Attempt to log in with invalid credentials multiple times
2. Verify:
   - Account lockout message is displayed after threshold is reached
   - Login attempts are blocked temporarily

#### Network Failures
1. Disable network connection
2. Attempt to log in
3. Verify:
   - Appropriate error message is displayed
   - Graceful failure handling

#### Expected Results
- Clear error messages are displayed
- User can retry after correcting the issue
- No sensitive information is leaked in error messages

## Test Reporting

For each test case, document:
1. Test date and time
2. Test environment (browser, OS, etc.)
3. Test result (Pass/Fail)
4. Any observed issues or anomalies
5. Screenshots of relevant UI states

## Troubleshooting Common Issues

### Session Not Persisting
- Check that cookies are not being blocked
- Verify that the Supabase session is being stored correctly
- Check for any console errors related to authentication

### Token Refresh Failures
- Verify that the refresh token is being stored
- Check Supabase configuration for token expiration settings
- Ensure the refresh token endpoint is accessible

### Cross-Origin Issues
- Check CORS configuration in Supabase
- Verify that the extension has the correct permissions
- Check for any console errors related to CORS

## Security Considerations

During testing, verify these security aspects:
- Authentication tokens are not exposed in URLs
- Failed login attempts are properly rate-limited
- Sessions expire after the configured timeout
- Sensitive operations require re-authentication
- Password requirements are enforced during registration and reset
