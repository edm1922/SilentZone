/**
 * Script to clean up Firebase-related files after migration to Supabase
 *
 * Usage:
 * Run: node scripts/cleanup-firebase-complete.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to remove
const filesToRemove = [
  'src/lib/firebase.ts',
  'src/lib/firebase-config.ts',
  'src/contexts/auth-context.tsx',
  'src/hooks/use-mute-rules.ts',
  'src/components/auth/login-form.tsx',
  'src/components/auth/signup-form.tsx',
  'src/components/mute-rules/mute-rule-list.tsx',
  'src/components/muted-content-card.tsx',
  'firestore.rules',
  'firestore.indexes.json',
  'firebase.json',
  '.firebaserc',
  'firebase-export.json',
];

// Directories to remove
const dirsToRemove = [
  'firebase-emulators',
  'functions',
];

// Dependencies to uninstall
const dependenciesToUninstall = [
  'firebase',
  'firebase-admin',
  'firebase-functions',
  '@firebase/app-types',
  '@firebase/auth-types',
  '@firebase/firestore-types',
];

console.log('Starting Firebase cleanup...');

// Remove files
console.log('\nRemoving Firebase files:');
filesToRemove.forEach(file => {
  const filePath = path.resolve(file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${file}`);
    } catch (error) {
      console.error(`❌ Error removing ${file}:`, error.message);
    }
  } else {
    console.log(`⚠️ Not found: ${file}`);
  }
});

// Remove directories
console.log('\nRemoving Firebase directories:');
dirsToRemove.forEach(dir => {
  const dirPath = path.resolve(dir);
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Removed: ${dir}`);
    } catch (error) {
      console.error(`❌ Error removing ${dir}:`, error.message);
    }
  } else {
    console.log(`⚠️ Not found: ${dir}`);
  }
});

// Uninstall dependencies
console.log('\nUninstalling Firebase dependencies:');
try {
  const dependenciesString = dependenciesToUninstall.join(' ');
  execSync(`npm uninstall ${dependenciesString}`, { stdio: 'inherit' });
  console.log('✅ Uninstalled Firebase dependencies');
} catch (error) {
  console.error('❌ Error uninstalling dependencies:', error.message);
}

// Update package.json to remove Firebase-related scripts
console.log('\nUpdating package.json:');
try {
  const packageJsonPath = path.resolve('package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Remove Firebase-related scripts
  const scriptsToRemove = ['firebase', 'emulators'];
  let scriptsRemoved = false;

  if (packageJson.scripts) {
    Object.keys(packageJson.scripts).forEach(scriptName => {
      if (scriptsToRemove.some(term => scriptName.includes(term))) {
        delete packageJson.scripts[scriptName];
        scriptsRemoved = true;
      }
    });
  }

  if (scriptsRemoved) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Removed Firebase-related scripts from package.json');
  } else {
    console.log('⚠️ No Firebase-related scripts found in package.json');
  }
} catch (error) {
  console.error('❌ Error updating package.json:', error.message);
}

console.log('\nFirebase cleanup completed!');
console.log('\nNext steps:');
console.log('1. Update your .env.local file to remove Firebase environment variables');
console.log('2. Update your README.md and documentation to reflect the migration to Supabase');
console.log('3. Test your application to ensure everything works correctly with Supabase');
