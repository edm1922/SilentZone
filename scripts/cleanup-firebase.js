/**
 * Script to clean up Firebase-related files after migration to Supabase
 *
 * Usage:
 * Run: node scripts/cleanup-firebase.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to remove
const filesToRemove = [
  'SilentZone/src/lib/firebase.ts',
  'SilentZone/src/lib/firebase-config.ts',
  'SilentZone/src/contexts/auth-context.tsx',
  'SilentZone/src/hooks/use-mute-rules.ts',
  'SilentZone/firestore.rules',
  'SilentZone/firestore.indexes.json',
  'SilentZone/firebase.json',
  'SilentZone/.firebaserc',
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
      console.log(`✅ Removed directory: ${dir}`);
    } catch (error) {
      console.error(`❌ Error removing directory ${dir}:`, error.message);
    }
  } else {
    console.log(`⚠️ Not found: ${dir}`);
  }
});

// Uninstall dependencies
console.log('\nUninstalling Firebase dependencies:');
try {
  const dependencies = dependenciesToUninstall.join(' ');
  console.log(`Running: npm uninstall ${dependencies}`);
  execSync(`npm uninstall ${dependencies}`, { stdio: 'inherit' });
  console.log('✅ Successfully uninstalled Firebase dependencies');
} catch (error) {
  console.error('❌ Error uninstalling dependencies:', error.message);
}

console.log('\nFirebase cleanup completed!');
console.log('\nReminder: You may need to manually update imports in your components.');
console.log('Check for any remaining references to Firebase in your codebase.');
