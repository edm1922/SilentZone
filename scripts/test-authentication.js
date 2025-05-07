/**
 * Authentication Testing Script
 *
 * This script helps automate testing of authentication flows in the SilentZone application.
 * It uses Puppeteer to simulate user interactions with the web application.
 *
 * Usage:
 * node scripts/test-authentication.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  baseUrl: 'http://localhost:9002',
  testUser: {
    email: 'edwardgarcia1635@gmail.com',
    password: 'testpassword123',
    newPassword: 'newtestpassword123'
  },
  screenshotsDir: path.join(__dirname, '../test-results/screenshots'),
  headless: false, // Set to true for CI environments
};

// Ensure screenshots directory exists
if (!fs.existsSync(config.screenshotsDir)) {
  fs.mkdirSync(config.screenshotsDir, { recursive: true });
}

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  results: []
};

/**
 * Main test runner
 */
async function runTests() {
  console.log('Starting authentication tests...');

  const browser = await puppeteer.launch({
    headless: config.headless,
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    // Run test cases
    await testRegistration(browser);
    await testLogin(browser);
    await testPasswordReset(browser);
    await testSessionPersistence(browser);
    await testLogout(browser);

    // Print summary
    console.log('\nTest Summary:');
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Skipped: ${testResults.skipped}`);

    // Write detailed results to file
    fs.writeFileSync(
      path.join(__dirname, '../test-results/auth-test-results.json'),
      JSON.stringify(testResults, null, 2)
    );

  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    await browser.close();
  }
}

/**
 * Test user registration
 */
async function testRegistration(browser) {
  const testName = 'User Registration';
  console.log(`\nRunning test: ${testName}`);

  const page = await browser.newPage();

  try {
    // Navigate to signup page
    await page.goto(`${config.baseUrl}/signup`);
    await page.waitForSelector('form');

    // Fill out the form
    await page.type('input[type="email"]', config.testUser.email);
    await page.type('input[type="password"]', config.testUser.password);
    await page.type('input[id="confirmPassword"]', config.testUser.password);

    // Take screenshot
    await page.screenshot({
      path: path.join(config.screenshotsDir, 'registration-form.png')
    });

    // Submit the form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    // Check if registration was successful (redirected to dashboard)
    const currentUrl = page.url();
    const success = currentUrl.includes('/dashboard');

    // Take screenshot of result
    await page.screenshot({
      path: path.join(config.screenshotsDir, 'registration-result.png')
    });

    // Record result
    recordTestResult(testName, success,
      success ? 'Successfully registered and redirected to dashboard'
              : `Registration failed, current URL: ${currentUrl}`
    );

  } catch (error) {
    recordTestResult(testName, false, `Error: ${error.message}`);
  } finally {
    await page.close();
  }
}

/**
 * Test user login
 */
async function testLogin(browser) {
  const testName = 'User Login';
  console.log(`\nRunning test: ${testName}`);

  const page = await browser.newPage();

  try {
    // Navigate to login page
    await page.goto(`${config.baseUrl}/login`);
    await page.waitForSelector('form');

    // Fill out the form
    await page.type('input[type="email"]', config.testUser.email);
    await page.type('input[type="password"]', config.testUser.password);

    // Take screenshot
    await page.screenshot({
      path: path.join(config.screenshotsDir, 'login-form.png')
    });

    // Submit the form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    // Check if login was successful (redirected to dashboard)
    const currentUrl = page.url();
    const success = currentUrl.includes('/dashboard');

    // Take screenshot of result
    await page.screenshot({
      path: path.join(config.screenshotsDir, 'login-result.png')
    });

    // Record result
    recordTestResult(testName, success,
      success ? 'Successfully logged in and redirected to dashboard'
              : `Login failed, current URL: ${currentUrl}`
    );

  } catch (error) {
    recordTestResult(testName, false, `Error: ${error.message}`);
  } finally {
    await page.close();
  }
}

/**
 * Test password reset
 */
async function testPasswordReset(browser) {
  const testName = 'Password Reset';
  console.log(`\nRunning test: ${testName}`);

  const page = await browser.newPage();

  try {
    // Navigate to login page
    await page.goto(`${config.baseUrl}/login`);
    await page.waitForSelector('form');

    // Click forgot password link
    await Promise.all([
      page.click('a[href="/reset-password"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    // Fill out the reset form
    await page.type('input[type="email"]', config.testUser.email);

    // Take screenshot
    await page.screenshot({
      path: path.join(config.screenshotsDir, 'password-reset-form.png')
    });

    // Submit the form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForSelector('.success-message', { timeout: 5000 })
        .catch(() => {}) // Ignore if not found
    ]);

    // Take screenshot of result
    await page.screenshot({
      path: path.join(config.screenshotsDir, 'password-reset-result.png')
    });

    // Check for success message
    const successMessage = await page.$('.success-message');
    const success = !!successMessage;

    // Record result
    recordTestResult(testName, success,
      success ? 'Password reset email sent successfully'
              : 'No success message found after password reset request'
    );

    // Note: We can't fully automate the email verification part
    console.log('Note: Check email manually to complete password reset test');

  } catch (error) {
    recordTestResult(testName, false, `Error: ${error.message}`);
  } finally {
    await page.close();
  }
}

/**
 * Test session persistence
 */
async function testSessionPersistence(browser) {
  const testName = 'Session Persistence';
  console.log(`\nRunning test: ${testName}`);

  // First, ensure we're logged in
  const loginPage = await browser.newPage();

  try {
    // Log in
    await loginPage.goto(`${config.baseUrl}/login`);
    await loginPage.waitForSelector('form');
    await loginPage.type('input[type="email"]', config.testUser.email);
    await loginPage.type('input[type="password"]', config.testUser.password);
    await Promise.all([
      loginPage.click('button[type="submit"]'),
      loginPage.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);
    await loginPage.close();

    // Create a new page/tab to test persistence
    const newPage = await browser.newPage();

    // Go directly to dashboard
    await newPage.goto(`${config.baseUrl}/dashboard`);
    await newPage.waitForTimeout(2000); // Wait for any redirects

    // Take screenshot
    await newPage.screenshot({
      path: path.join(config.screenshotsDir, 'session-persistence.png')
    });

    // Check if we're still on the dashboard
    const currentUrl = newPage.url();
    const success = currentUrl.includes('/dashboard');

    // Record result
    recordTestResult(testName, success,
      success ? 'Session persisted successfully'
              : `Session did not persist, redirected to: ${currentUrl}`
    );

    await newPage.close();

  } catch (error) {
    recordTestResult(testName, false, `Error: ${error.message}`);
    if (loginPage) await loginPage.close();
  }
}

/**
 * Test logout
 */
async function testLogout(browser) {
  const testName = 'User Logout';
  console.log(`\nRunning test: ${testName}`);

  const page = await browser.newPage();

  try {
    // First, ensure we're logged in
    await page.goto(`${config.baseUrl}/login`);
    await page.waitForSelector('form');
    await page.type('input[type="email"]', config.testUser.email);
    await page.type('input[type="password"]', config.testUser.password);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    // Find and click logout button
    await page.waitForSelector('button:has-text("Logout"), button:has-text("Sign out")');

    // Take screenshot before logout
    await page.screenshot({
      path: path.join(config.screenshotsDir, 'before-logout.png')
    });

    // Click logout
    await Promise.all([
      page.click('button:has-text("Logout"), button:has-text("Sign out")'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    // Take screenshot after logout
    await page.screenshot({
      path: path.join(config.screenshotsDir, 'after-logout.png')
    });

    // Check if we're redirected to login page
    const currentUrl = page.url();
    const success = currentUrl.includes('/login');

    // Record result
    recordTestResult(testName, success,
      success ? 'Successfully logged out and redirected to login page'
              : `Logout failed, current URL: ${currentUrl}`
    );

    // Try accessing a protected route
    await page.goto(`${config.baseUrl}/dashboard`);
    await page.waitForTimeout(2000); // Wait for any redirects

    // Check if we're redirected away from dashboard
    const protectedUrl = page.url();
    const protectedSuccess = !protectedUrl.includes('/dashboard');

    // Take screenshot of protected route attempt
    await page.screenshot({
      path: path.join(config.screenshotsDir, 'protected-route-after-logout.png')
    });

    // Record result
    recordTestResult(`${testName} - Protected Route`, protectedSuccess,
      protectedSuccess ? 'Protected route correctly redirected after logout'
                      : 'Still able to access protected route after logout'
    );

  } catch (error) {
    recordTestResult(testName, false, `Error: ${error.message}`);
  } finally {
    await page.close();
  }
}

/**
 * Record a test result
 */
function recordTestResult(testName, passed, message) {
  if (passed) {
    console.log(`✅ PASSED: ${testName}`);
    testResults.passed++;
  } else {
    console.log(`❌ FAILED: ${testName} - ${message}`);
    testResults.failed++;
  }

  testResults.results.push({
    name: testName,
    passed,
    message,
    timestamp: new Date().toISOString()
  });
}

// Run the tests
runTests().catch(console.error);
