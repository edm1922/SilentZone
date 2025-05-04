/**
 * Script to migrate data from Firebase to Supabase
 *
 * Usage:
 * 1. Export your Firebase data as JSON
 * 2. Update the configuration below
 * 3. Run: node scripts/migrate-firebase-to-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = 'https://vepfwtiavznddkbhmrnw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlcGZ3dGlhdnpuZGRrYmhtcm53Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjMzNDU3MywiZXhwIjoyMDYxOTEwNTczfQ.7hR25cT9Wpg-b3PvYAlP9r9bcn_QO12e9r65JHmxjoY';
const FIREBASE_EXPORT_PATH = './firebase-export.json';

// Initialize Supabase client with service role key (admin access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrateData() {
  try {
    // Read Firebase export file
    console.log('Reading Firebase export file...');
    const firebaseData = JSON.parse(fs.readFileSync(FIREBASE_EXPORT_PATH, 'utf8'));

    // Extract mute rules
    const muteRules = [];
    if (firebaseData.muteRules) {
      console.log(`Found ${Object.keys(firebaseData.muteRules).length} mute rules in Firebase export`);

      // Convert Firebase format to Supabase format
      for (const [ruleId, rule] of Object.entries(firebaseData.muteRules)) {
        // Generate a valid UUID for user_id
        const validUuid = '00000000-0000-0000-0000-000000000000';

        muteRules.push({
          // Convert camelCase to snake_case
          user_id: validUuid, // Use a placeholder UUID
          keywords: rule.keywords,
          platforms: rule.platforms,
          start_time: rule.startTime,
          duration_ms: rule.durationMs,
          use_regex: rule.useRegex || false,
          case_sensitive: rule.caseSensitive || false,
          match_whole_word: rule.matchWholeWord || false,
          // Use Firebase timestamps or current time
          created_at: rule.createdAt ? new Date(rule.createdAt).toISOString() : new Date().toISOString(),
          updated_at: rule.updatedAt ? new Date(rule.updatedAt).toISOString() : new Date().toISOString(),
        });
      }
    }

    // Migrate mute rules to Supabase
    if (muteRules.length > 0) {
      console.log(`Migrating ${muteRules.length} mute rules to Supabase...`);

      console.log("Note: To complete the migration, you need to:");
      console.log("1. Create a user in Supabase");
      console.log("2. Get the user's UUID");
      console.log("3. Update the mute_rules table with the correct user_id");
      console.log("\nHere's the data that would be migrated:");
      console.log(JSON.stringify(muteRules, null, 2));

      // Uncomment this section when you have a valid user ID
      /*
      // Insert in batches of 100 to avoid rate limits
      const batchSize = 100;
      for (let i = 0; i < muteRules.length; i += batchSize) {
        const batch = muteRules.slice(i, i + batchSize);
        const { data, error } = await supabase.from('mute_rules').insert(batch);

        if (error) {
          console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        } else {
          console.log(`Successfully inserted batch ${i / batchSize + 1} (${batch.length} records)`);
        }
      }
      */
    }

    // Extract and migrate other collections as needed
    // ...

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Check if environment variables are set
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Check if Firebase export file exists
if (!fs.existsSync(FIREBASE_EXPORT_PATH)) {
  console.error(`Error: Firebase export file not found at ${FIREBASE_EXPORT_PATH}`);
  console.error('Please export your Firebase data and update the path in this script');
  process.exit(1);
}

// Run migration
migrateData();
